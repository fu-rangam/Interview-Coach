export enum AppScreen {
  HOME = 'HOME',
  ROLE_SELECTION = 'ROLE_SELECTION',
  INTERVIEW = 'INTERVIEW',
  REVIEW = 'REVIEW',
  SUMMARY = 'SUMMARY',
}

// --- Competency Blueprint Types ---

export interface Competency {
  id: string;
  name: string;
  definition: string;
  signals: string[];
  evidenceExamples: string[];
  weight: number;
  bands: {
    Developing: string;
    Good: string;
    Strong: string;
  };
}

export interface ScoringDimension {
  id: string;
  name: string;
  weight: number;
}

export interface CompetencyBlueprint {
  role: {
    title: string;
    seniority?: string;
  };
  readingLevel: {
    mode: string;
    maxSentenceWords: number;
    avoidJargon: boolean;
  };
  competencies: Competency[];
  questionMix: {
    behavioral: number;
    situational: number;
    technical: number;
  };
  scoringModel: {
    dimensions: ScoringDimension[];
    ratingBands: {
      Developing: { min: number; max: number };
      Good: { min: number; max: number };
      Strong: { min: number; max: number };
    };
  };
}

// --- Question Plan Types ---

export interface QuestionPlanItem {
  id: string;
  competencyId: string;
  type: 'behavioral' | 'situational' | 'technical';
  difficulty: 'easy' | 'medium' | 'hard';
  intent: string;
  rubricHints: string[];
}

export interface QuestionPlan {
  role: string;
  questions: QuestionPlanItem[];
}

// --- Core App Types ---

export interface QuestionTips {
  lookingFor: string;
  pointsToCover: string[];
  answerFramework: string;
  industrySpecifics: {
    metrics: string;
    tools: string;
  };
  mistakesToAvoid: string[];
  proTip: string;
}

export interface Question {
  id: string;
  text: string;
  tips?: QuestionTips;
  // New fields from Question Plan
  competencyId?: string;
  type?: string;
  difficulty?: string;
  intent?: string;
  isLoading?: boolean;
}

export interface DimensionScore {
  dimensionId: string;
  score: number;
  note: string;
}

export interface AnalysisResult {
  transcript: string;
  feedback: string[]; // Generic points if granular not available
  keyTerms: string[];
  deliveryStatus?: string; // e.g., "Clear & Paced", "Too Fast", "Monotone"
  deliveryTips?: string[]; // Specific delivery, tone, pace feedback
  rating: string; // e.g., "Strong", "Good", "Developing"
  coachReaction?: string; // e.g., "Great use of STAR method!"
  strongResponse?: string;
  whyThisWorks?: QuestionTips;

  // New standardized evaluation fields
  questionId?: string; // Link back
  competencyId?: string;
  dimensionScores?: DimensionScore[];
  answerScore?: number; // Numeric 0-100
  evidenceExtracts?: string[];
  missingElements?: string[];
  biggestUpgrade?: string; // Focused improvement
  redoPrompt?: string; // Prompt for re-answering
}

export interface InterviewSession {
  id?: string;
  role: string;
  jobDescription?: string; // Optional job description context
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<
    string,
    {
      audioBlob?: Blob; // Optional if answering via text
      text?: string; // Optional if answering via voice
      analysis: AnalysisResult | null;
    }
  >;
  status?: 'IDLE' | 'ACTIVE' | 'COMPLETED';
  // Store the blueprint for this session
  blueprint?: CompetencyBlueprint;
  // Store intake data for context persistence
  intakeData?: import('./intake').OnboardingIntakeV1;
  engagedTimeSeconds?: number;
}

export const TECH_ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Analyst',
  'UX Designer',
  'Digital Marketer',
  'IT Support Specialist',
  'Cybersecurity Analyst',
  'DevOps Engineer',
  'QA Engineer',
];

export const SERVICE_ROLES = [
  'Retail Sales Associate',
  'Cashier',
  'Home Health Aide',
  'Warehouse Associate',
  'Food Preparation Worker',
  'Customer Service Rep',
  'Stock Clerk',
  'Janitor / Custodian',
  'Packer / Packager',
];
