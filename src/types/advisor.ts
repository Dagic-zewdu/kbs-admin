export interface Option {
  value: string;
  label: string;
}

/** Choices of the advisor profile and claims, from the API */
export interface AdvisorOptions {
  purposes: Option[];
  concerns: Option[];
  skinTypes: Option[];
  hairTypes: Option[];
  routineSteps: Option[];
  timesOfDay: Option[];
  frequencies: Option[];
  strengths: Option[];
  textures: Option[];
  feels: Option[];
  cautions: Option[];
  claims: Option[];
  ageGroups: Option[];
  madeFor: Option[];
  skinTones: Option[];
  undertones: Option[];
  experiences: Option[];
  bodyAreas: Option[];
  resultsAfter: Option[];
  weather: Option[];
  finishes: Option[];
  coverages: Option[];
  scents: Option[];
}

export interface KeyIngredient {
  name: string;
  percent: number | null;
}

export interface CustomerQuestion {
  question: string;
  answer: string;
}

/** What the AI beauty advisor needs. Everything is optional. */
export interface AdvisorProfile {
  purposes: string[];
  concerns: string[];
  goodForSkin: string[];
  goodForHair: string[];
  notForSkin: string[];
  notForHair: string[];
  keyIngredients: KeyIngredient[];
  routineStep: string | null;
  timeOfDay: string | null;
  frequency: string | null;
  strength: string | null;
  texture: string | null;
  feel: string | null;
  cautions: string[];
  summary: string | null;
  keywords: string[];
  ageGroups: string[];
  madeFor: string | null;
  skinTones: string[];
  undertones: string[];
  experience: string | null;
  bodyAreas: string[];
  resultsAfter: string | null;
  weather: string[];
  finish: string | null;
  coverage: string | null;
  scent: string | null;
  keyBenefits: string[];
  worksWith: string[];
  avoidWith: string[];
  customerQuestions: CustomerQuestion[];
}

export const emptyAdvisorProfile: AdvisorProfile = {
  purposes: [],
  concerns: [],
  goodForSkin: [],
  goodForHair: [],
  notForSkin: [],
  notForHair: [],
  keyIngredients: [],
  routineStep: null,
  timeOfDay: null,
  frequency: null,
  strength: null,
  texture: null,
  feel: null,
  cautions: [],
  summary: null,
  keywords: [],
  ageGroups: [],
  madeFor: null,
  skinTones: [],
  undertones: [],
  experience: null,
  bodyAreas: [],
  resultsAfter: null,
  weather: [],
  finish: null,
  coverage: null,
  scent: null,
  keyBenefits: [],
  worksWith: [],
  avoidWith: [],
  customerQuestions: [],
};

export interface ProductIngredient {
  name: string;
  percent: number | null;
  /** Recognized from the name, e.g. BHA */
  types: Option[];
}

/** Worked out automatically from the ingredients */
export interface IngredientAnalysis {
  cautions: string[];
  warnings: string[];
  dontCombineWith: Option[];
  claimConflicts: { claim: string; label: string; ingredients: string[] }[];
}

export interface AdvisorCompleteness {
  percent: number;
  missing: string[];
  canBeRecommended: boolean;
}
