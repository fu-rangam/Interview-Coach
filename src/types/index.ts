export enum AppScreen {
  HOME = 'HOME',
  ROLE_SELECTION = 'ROLE_SELECTION',
  INTERVIEW = 'INTERVIEW',
  REVIEW = 'REVIEW',
  SUMMARY = 'SUMMARY',
}

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
}

export interface AnalysisResult {
  transcript: string;
  feedback: string[];
  keyTerms: string[];
  deliveryStatus?: string; // e.g., "Clear & Paced", "Too Fast", "Monotone"
  deliveryTips?: string[]; // Specific delivery, tone, pace feedback
  rating: string; // e.g., "Strong", "Good", "Developing"
}

export interface InterviewSession {
  role: string;
  jobDescription?: string; // Optional job description context
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, {
    audioBlob?: Blob; // Optional if answering via text
    text?: string;    // Optional if answering via voice
    analysis: AnalysisResult | null;
  }>;
}

export const TECH_ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "Digital Marketer",
  "IT Support Specialist",
  "Cybersecurity Analyst",
  "DevOps Engineer",
  "QA Engineer"
];

export const SERVICE_ROLES = [
  "Retail Sales Associate",
  "Cashier",
  "Home Health Aide",
  "Warehouse Associate",
  "Food Preparation Worker",
  "Customer Service Rep",
  "Stock Clerk",
  "Janitor / Custodian",
  "Packer / Packager"
];