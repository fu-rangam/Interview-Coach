export enum AppScreen {
  HOME = 'HOME',
  ROLE_SELECTION = 'ROLE_SELECTION',
  INTERVIEW = 'INTERVIEW',
  REVIEW = 'REVIEW',
  SUMMARY = 'SUMMARY',
}

export interface Question {
  id: string;
  text: string;
}

export interface AnalysisResult {
  transcript: string;
  feedback: string[];
  keyTerms: string[];
  rating: string; // e.g., "Strong", "Good", "Needs Improvement"
}

export interface InterviewSession {
  role: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, {
    audioBlob: Blob;
    analysis: AnalysisResult | null;
  }>;
}

export const JOB_ROLES = [
  "Data Analytics",
  "E-Commerce",
  "IT Support",
  "Project Management",
  "UX Design",
  "Cybersecurity",
  "Digital Marketing",
  "General"
];