import { Question, AnalysisResult, QuestionTips } from "../types";

// --- Helpers ---

// --- Mock Data Generators ---

const mockQuestions = (role: string): Question[] => [
  { id: '1', text: `Tell me about a time you faced a challenge in ${role}.` },
  { id: '2', text: `Why are you interested in a career in ${role}?` },
  { id: '3', text: "Describe a successful project you worked on." },
];

const mockTips = (role: string): QuestionTips => ({
  lookingFor: "The interviewer wants to see your problem-solving process and resilience.",
  pointsToCover: ["The specific situation", "The action you took", "The positive result"],
  answerFramework: "Use the STAR method (Situation, Task, Action, Result) to structure your response.",
  industrySpecifics: {
    metrics: "Efficiency improvement, cost reduction",
    tools: "Jira, Trello, Slack"
  },
  mistakesToAvoid: ["Blaming others", "Being vague about your contribution", "Focusing too much on the problem instead of the solution"],
  proTip: "Turn the challenge into a learning opportunity."
});

const mockAnalysis = (): AnalysisResult => ({
  transcript: "This is a simulated transcript because the API call failed or no key was provided. I talked about my experience with leading teams and solving complex data problems.",
  feedback: [
    "Try to use the STAR method (Situation, Task, Action, Result) more explicitly.",
    "Your tone was confident, which is great.",
    "Mention specific tools or technologies you utilized."
  ],
  keyTerms: ["Leadership", "Data Analysis", "Problem Solving"],
  rating: "Developing",
  deliveryStatus: "Clear & Paced",
  deliveryTips: ["Good volume, but try to vary your pitch to sound more engaging.", "Pace was steady and easy to follow."],
  strongResponse: "A strong response would clearly articulate the situation, task, action, and result, demonstrating leadership and technical skills.",
  whyThisWorks: {
    lookingFor: "Demonstrates clear leadership.",
    pointsToCover: ["Situation clearly described", "Action detailed", "Result quantified"],
    answerFramework: "Follows STAR perfectly.",
    industrySpecifics: { metrics: "Mentioned 20% growth", tools: "Used Python and SQL" },
    mistakesToAvoid: ["Did not blame others", "Was specific"],
    proTip: "Showed growth mindset."
  }
});

import { supabase } from "./supabase";

// --- Helpers ---

export const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- API Functions ---

export const generateQuestions = async (role: string, jobDescription?: string): Promise<Question[]> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ role, jobDescription })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const questions = await response.json();
    return questions as Question[];
  } catch (error) {
    console.error("Error generating questions:", error);
    return mockQuestions(role);
  }
};

export const generateQuestionTips = async (question: string, role: string): Promise<QuestionTips> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ question, role })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const tips = await response.json();
    return tips as QuestionTips;
  } catch (error) {
    console.error("Error generating tips:", error);
    return mockTips(role);
  }
};

// Reverted to fast analysis (no tips needed)
// Reverted to fast analysis (no tips needed)
export const analyzeAnswer = async (question: string, input: Blob | string): Promise<AnalysisResult> => {
  try {
    let payload: any = { question };

    if (typeof input === 'string') {
      payload.input = input;
    } else {
      // Audio Input - Convert to base64
      const base64Audio = await blobToBase64(input);
      payload.input = {
        mimeType: input.type || 'audio/webm',
        data: base64Audio
      };
    }

    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/analyze-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    return result as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing answer:", error);
    return mockAnalysis();
  }
};

export const generateStrongResponse = async (question: string, tips: QuestionTips): Promise<{ strongResponse: string; whyThisWorks: QuestionTips }> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-strong-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ question, tips })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating strong response:", error);
    // Fallback for demo/error purposes
    return {
      strongResponse: "Could not generate strong response at this time.",
      whyThisWorks: tips // Fallback to just showing original tips structure if generation fails
    };
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text.trim()) return null;

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.audioBase64) {
      throw new Error("No audio data returned from server");
    }

    // Convert the Base64 back to a Blob for playback
    const binaryString = atob(data.audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const mimeType = data.mimeType || 'audio/mpeg';

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    return url;

  } catch (error) {
    console.error("TTS Fetch Error:", error);
    throw error;
  }
};