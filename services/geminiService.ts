import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, ScanResult, RiskLevel } from '../types.ts';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Prompt construction helper
const createSystemInstruction = (profile: UserProfile): string => {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'te': 'Telugu (తెలుగు)',
    'hi': 'Hindi (हिंदी)'
  };
  const targetLanguage = languageMap[profile.language] || 'English';

  return `
    You are True Label, an expert medical and food safety AI assistant. 
    Your job is to analyze product ingredients (from text or image OCR) and evaluate safety for a specific user.
    
    USER PROFILE:
    - Age: ${profile.age}
    - Gender: ${profile.gender}
    - Conditions: ${profile.conditions.join(', ')}
    - Allergies: ${profile.allergies.join(', ')}
    - Current Medications: ${profile.medications.join(', ')}
    
    CRITICAL INSTRUCTION:
    Output the JSON keys in English, BUT ensure all string values (summary, usage, safetyConcerns, directions, ingredient reasons, bannedCountries) are translated into ${targetLanguage}.

    STRICT ANALYSIS RULES:
    1. OCR: Extract text from the provided image or text input. Identify if it is a medicine or food.
    2. CHECK ALLERGIES: Compare ingredients against user allergies. High Risk.
    3. CHECK INTERACTIONS: Compare ingredients against user medications. High/Medium Risk.
    4. CHECK CONDITIONS: specific ingredients bad for ${profile.conditions.join(', ')}.
    5. GLOBAL BANS: Check if ingredients (e.g., Nimesulide, Cisapride, specific food dyes, Titanium Dioxide, Potassium Bromate) are banned by FDA, WHO, CDSCO, EU Commission, or other regulatory bodies.
    6. BANNED COUNTRIES: Cross-reference ingredients with global regulatory bans (EU, USA, India, Japan, UK). Explicitly list countries where the product/ingredients are restricted or banned (e.g., 'Banned in EU', 'Restricted in California').
    7. USAGE & DIRECTIONS: Identify what the product is for and how to use it safely.
    8. SAFETY CONCERNS: If specific risks exist, list them. IF SAFE, provide a general health/safety tip relevant to this product type (e.g., "Store in a cool dry place", "Consume in moderation"). This field MUST NOT be empty.
    
    OUTPUT FORMAT:
    Return valid JSON only.
    Structure:
    {
      "productName": "string",
      "riskLevel": "SAFE" | "CAUTION" | "DANGER",
      "summary": "string (Short overview in ${targetLanguage})",
      "usage": "string (What is this product used for? in ${targetLanguage})",
      "safetyConcerns": "string (Specific warnings. If safe, provide a general safety tip in ${targetLanguage})",
      "directions": "string (How to use/consume this product in ${targetLanguage})",
      "detectedAllergens": ["string (English)"],
      "drugInteractions": ["string (English)"],
      "conditionConflicts": ["string (English)"],
      "bannedStatus": "string or null (Summary of ban status)",
      "bannedCountries": ["string (Country names in ${targetLanguage})"],
      "ingredients": [
        { "name": "string (English)", "status": "safe" | "caution" | "danger", "reason": "string (in ${targetLanguage})" }
      ]
    }

    CRITERIA FOR RISK LEVEL:
    - DANGER: Direct allergen match, severe drug interaction, or banned in major countries (USA, EU, India, etc.).
    - CAUTION: Mild interaction, high sugar/salt for diabetic/hypertensive, or dosage warnings.
    - SAFE: No known conflicts and not banned.
  `;
};

export const analyzeProduct = async (
  input: string | File, 
  profile: UserProfile
): Promise<ScanResult> => {
  
  const systemInstruction = createSystemInstruction(profile);
  
  try {
    let response;

    const schema = {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING },
        riskLevel: { type: Type.STRING, enum: ["SAFE", "CAUTION", "DANGER"] },
        summary: { type: Type.STRING },
        usage: { type: Type.STRING },
        safetyConcerns: { type: Type.STRING },
        directions: { type: Type.STRING },
        detectedAllergens: { type: Type.ARRAY, items: { type: Type.STRING } },
        drugInteractions: { type: Type.ARRAY, items: { type: Type.STRING } },
        conditionConflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
        bannedStatus: { type: Type.STRING, nullable: true },
        bannedCountries: { type: Type.ARRAY, items: { type: Type.STRING } },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["safe", "caution", "danger"] },
              reason: { type: Type.STRING }
            }
          }
        }
      },
      required: ["productName", "riskLevel", "summary", "usage", "safetyConcerns", "directions", "ingredients", "bannedCountries"]
    };

    if (input instanceof File) {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(input);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
      });

      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: input.type, data: base64Data } },
                { text: "Analyze this product label image." }
            ]
        },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
    }

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const analysis = JSON.parse(text);

    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...analysis
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      productName: "Scan Error",
      riskLevel: RiskLevel.CAUTION,
      summary: "Could not process image or text. Please try again or ensure the image is clear.",
      usage: "Unknown",
      safetyConcerns: "Analysis failed",
      directions: "N/A",
      ingredients: [],
      detectedAllergens: [],
      drugInteractions: [],
      conditionConflicts: [],
      bannedStatus: null,
      bannedCountries: []
    };
  }
};

export const generateDailyTip = async (): Promise<{tip: string, quiz: any}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: "Generate a short 1-sentence health safety tip and one multiple choice quiz question (JSON) related to food or medicine safety.",
            config: {
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return {
            tip: "Always check expiration dates before consumption.",
            quiz: null
        }
    }
}