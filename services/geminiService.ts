import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, ScanResult, RiskLevel, SECURITY_CONFIG, AlternativeProduct } from '../types.ts';

/**
 * Client-side Rate Limiting State
 */
const requestHistory: number[] = [];

const isRateLimited = (): boolean => {
  const now = Date.now();
  while (requestHistory.length > 0 && requestHistory[0] < now - SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS) {
    requestHistory.shift();
  }
  return requestHistory.length >= SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_WINDOW;
};

const sanitizeString = (input: string, maxLength: number): string => {
  if (!input) return "";
  const stripped = input.replace(/<[^>]*>?/gm, '');
  return stripped.substring(0, maxLength).trim();
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createSystemInstruction = (profile: UserProfile): string => {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'te': 'Telugu (తెలుగు)',
    'hi': 'Hindi (हिंदी)'
  };
  const targetLanguage = languageMap[profile.language] || 'English';

  const sanitizedConditions = profile.conditions.map(c => sanitizeString(c, SECURITY_CONFIG.MAX_ITEM_LENGTH));
  const sanitizedAllergies = profile.allergies.map(a => sanitizeString(a, SECURITY_CONFIG.MAX_ITEM_LENGTH));
  const sanitizedMeds = profile.medications.map(m => sanitizeString(m, SECURITY_CONFIG.MAX_ITEM_LENGTH));

  return `
    You are True Label, an expert medical and food safety AI assistant. 
    Analyze product ingredients and evaluate safety for this user.
    
    USER PROFILE:
    - Age: ${Math.min(profile.age, SECURITY_CONFIG.MAX_AGE)}
    - Gender: ${sanitizeString(profile.gender, 20)}
    - Conditions: ${sanitizedConditions.join(', ')}
    - Allergies: ${sanitizedAllergies.join(', ')}
    - Current Medications: ${sanitizedMeds.join(', ')}
    
    CRITICAL INSTRUCTION:
    Output JSON keys in English. String values translated into ${targetLanguage}.

    STRICT ANALYSIS RULES:
    1. OCR/Text: Extract text. Identify product type.
    2. CHECK ALLERGIES: High Risk if match.
    3. CHECK INTERACTIONS: High/Medium Risk with meds.
    4. CHECK CONDITIONS: Conflicts for profile conditions.
    5. GLOBAL BANS: Check FDA, WHO, CDSCO, EU.
    6. BANNED COUNTRIES: Explicitly list restriction regions.
    7. USAGE & DIRECTIONS: Safe usage guidelines.
    8. SAFETY CONCERNS: Specific warnings or general health tips.
    
    OUTPUT FORMAT (Valid JSON only):
    {
      "productName": "string",
      "riskLevel": "SAFE" | "CAUTION" | "DANGER",
      "summary": "string",
      "usage": "string",
      "safetyConcerns": "string",
      "directions": "string",
      "detectedAllergens": ["string"],
      "drugInteractions": ["string"],
      "conditionConflicts": ["string"],
      "bannedStatus": "string or null",
      "bannedCountries": ["string"],
      "ingredients": [
        { "name": "string", "status": "safe" | "caution" | "danger", "reason": "string" }
      ]
    }
  `;
};

export const analyzeProduct = async (
  input: string | File, 
  profile: UserProfile
): Promise<ScanResult> => {
  if (isRateLimited()) {
    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      productName: "System Notice",
      riskLevel: RiskLevel.CAUTION,
      summary: "Rate limit exceeded. Please wait a minute before scanning again.",
      usage: "N/A",
      safetyConcerns: "Too many requests in a short time.",
      directions: "Wait and try again.",
      ingredients: [],
      detectedAllergens: [],
      drugInteractions: [],
      conditionConflicts: [],
      bannedStatus: null,
      bannedCountries: []
    };
  }

  requestHistory.push(Date.now());
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
      if (input.size > 5 * 1024 * 1024) throw new Error("File size too large");
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
      const sanitizedInput = sanitizeString(input, SECURITY_CONFIG.MAX_INPUT_TEXT_LENGTH);
      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: sanitizedInput,
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
      summary: "Could not process scan. Ensure input is clear and valid.",
      usage: "Unknown",
      safetyConcerns: "Analysis failed due to technical error.",
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

export const findSaferAlternatives = async (
  result: ScanResult,
  profile: UserProfile
): Promise<AlternativeProduct[]> => {
  const languageMap: Record<string, string> = {
    'en': 'English',
    'te': 'Telugu (తెలుగు)',
    'hi': 'Hindi (हिंदी)'
  };
  const targetLanguage = languageMap[profile.language] || 'English';

  const systemInstruction = `
    You are True Label, a health safety assistant. 
    The user scanned "${result.productName}" which was rated "${result.riskLevel}" because of:
    - Allergens: ${result.detectedAllergens.join(', ')}
    - Interactions: ${result.drugInteractions.join(', ')}
    - Conflicts: ${result.conditionConflicts.join(', ')}

    USER PROFILE:
    - Conditions: ${profile.conditions.join(', ')}
    - Allergies: ${profile.allergies.join(', ')}
    - Meds: ${profile.medications.join(', ')}

    Suggest 3-4 safer alternative products (either food or medicine depending on the input) that would likely be "SAFE" for this specific user.
    Focus on popular, widely available brands.
    Output string values in ${targetLanguage}.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      alternatives: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            whySafer: { type: Type.STRING }
          },
          required: ["name", "brand", "whySafer"]
        }
      }
    },
    required: ["alternatives"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest safer alternatives to "${result.productName}" for my health profile.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const data = JSON.parse(response.text || '{"alternatives": []}');
    return data.alternatives;
  } catch (error) {
    console.error("Gemini Alternatives Error:", error);
    return [];
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