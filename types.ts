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
  productName: string; // Identified or generic name
  riskLevel: RiskLevel;
  summary: string; // "Safe to consume" or "Contains peanuts!"
  usage: string; // Primary use of product
  safetyConcerns: string; // Specific safety warnings
  directions: string; // How to use
  ingredients: IngredientAnalysis[];
  detectedAllergens: string[];
  drugInteractions: string[];
  conditionConflicts: string[];
  bannedStatus: string | null; // General status
  bannedCountries: string[]; // List of specific countries
  rawText?: string;
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
