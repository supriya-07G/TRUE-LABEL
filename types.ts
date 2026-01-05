export type Language = 'en' | 'te' | 'hi';

export enum RiskLevel {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  DANGER = 'DANGER',
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  weight: number;
  conditions: string[];
  allergies: string[];
  medications: string[];
  language: Language;
  onboardingCompleted: boolean;
}

export interface IngredientAnalysis {
  name: string;
  status: 'safe' | 'caution' | 'danger';
  reason: string;
}

export interface ScanResult {
  id: string;
  timestamp: number;
  productName: string;
  riskLevel: RiskLevel;
  summary: string;
  usage: string;
  safetyConcerns: string;
  directions: string;
  ingredients: IngredientAnalysis[];
  detectedAllergens: string[];
  drugInteractions: string[];
  conditionConflicts: string[];
  bannedStatus: string | null;
  bannedCountries: string[];
  rawText?: string;
}

export interface AlternativeProduct {
  name: string;
  brand: string;
  whySafer: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: 'Medication' | 'Food' | 'Allergy';
}

export type ViewState = 
  | 'ONBOARDING'
  | 'DASHBOARD'
  | 'SCANNER'
  | 'RESULTS'
  | 'CABINET'
  | 'HISTORY'
  | 'EDUCATION'
  | 'SETTINGS';

/**
 * Security Constants for Hardening
 */
export const SECURITY_CONFIG = {
  MAX_NAME_LENGTH: 100,
  MAX_AGE: 125,
  MAX_WEIGHT: 600,
  MAX_LIST_ITEMS: 100,
  MAX_ITEM_LENGTH: 200,
  MAX_INPUT_TEXT_LENGTH: 10000,
  RATE_LIMIT: {
    MAX_REQUESTS_PER_WINDOW: 5,
    WINDOW_MS: 60000, // 1 minute
  }
};