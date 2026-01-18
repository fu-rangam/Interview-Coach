import { Question, AnalysisResult, QuestionTips, CompetencyBlueprint, QuestionPlan } from "../types";
import { OnboardingIntakeV1 } from "../types/intake";
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

export const generateBlueprint = async (role: string, jobDescription?: string, seniority?: string): Promise<CompetencyBlueprint | null> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ role, jobDescription, seniority })
    });

    if (!response.ok) {
      console.error(`Blueprint generation failed: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating blueprint:", error);
    return null;
  }
};

export const initSession = async (role: string, jobDescription?: string, intakeData?: OnboardingIntakeV1) => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/init-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ role, jobDescription, intakeData })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Init Session Failed: ${response.status} ${response.statusText}`, errText);
      throw new Error(`Init session failed: ${response.status} ${errText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error initializing session:", error);
    return null;
  }
};

export const generateQuestionPlan = async (blueprint: CompetencyBlueprint): Promise<QuestionPlan | null> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-question-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ blueprint })
    });

    if (!response.ok) {
      console.error(`Question plan generation failed: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error generating question plan:", error);
    return null;
  }
};

export const generateQuestions = async (role: string, jobDescription?: string, questionPlan?: QuestionPlan, blueprint?: CompetencyBlueprint, subsetIndices?: number[]): Promise<Question[]> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ role, jobDescription, questionPlan, blueprint, subsetIndices })
    });

    if (!response.ok) {
      // Fallback to local mock if server fails (or dev mode without key)
      console.warn(`Server error ${response.status} for questions. Using fallback.`);
      throw new Error(`Server error: ${response.status}`);
    }

    const questions = await response.json();
    return questions as Question[];
  } catch (error) {
    console.error("Error generating questions:", error);
    // Minimal fallback
    return [
      { id: '1', text: `Tell me about a time you faced a challenge in ${role}.` },
      { id: '2', text: `Why are you interested in a career in ${role}?` },
      { id: '3', text: "Describe a successful project you worked on." },
    ];
  }
};

export const generateQuestionTips = async (question: string, role: string, competency?: any): Promise<QuestionTips> => {
  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/generate-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ question, role, competency })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const tips = await response.json();
    return tips as QuestionTips;
  } catch (error) {
    console.error("Error generating tips:", error);
    return {
      lookingFor: "General professional competence.",
      pointsToCover: ["Situation", "Action", "Result"],
      answerFramework: "STAR Method",
      industrySpecifics: { metrics: "N/A", tools: "N/A" },
      mistakesToAvoid: ["Being vague"],
      proTip: "Be confident."
    };
  }
};

export const analyzeAnswer = async (question: string, input: Blob | string, blueprint?: CompetencyBlueprint, questionId?: string): Promise<AnalysisResult> => {
  try {
    let payload: any = { question, blueprint, questionId };

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
    // Return minimal fallback to avoid crashing UI
    return {
      transcript: typeof input === 'string' ? input : "Audio processing unavailable.",
      feedback: ["System is currently offline. Please try again later."],
      rating: "Developing",
      keyTerms: [],
      coachReaction: "Keep practicing!",
      strongResponse: "System offline.",
      whyThisWorks: { lookingFor: "", pointsToCover: [], answerFramework: "", industrySpecifics: { metrics: "", tools: "" }, mistakesToAvoid: [], proTip: "" }
    };
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

  // Mock TTS Bypass
  if (import.meta.env.VITE_MOCK_TTS === 'true') {
    console.log("[TTS] Mock Mode Active: Returning silent audio.");
    // Return a short silent audio duration to simulate playback (1 second silent MP3)
    // using a data URI for a tiny silent MP3
    return "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAAAGGluZwAAAA8AAAAEAAABIAAAzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAATEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//OEAAABAAAA0gAAABRaaaaaaaaAAIgAAADSAAAAFE0AAAAAAAD78wAAAQD78wAAAQAAAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////OEAAAAAAAANIAAAAUWAAAAAAAACIAAAA0gAAABRgAAAAAAABAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAAB//OEAAAAAAAANIAAAAUWAAAAAAAACIAAAA0gAAABRhAAAAAAABAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAAHAAAAB";
  }

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