import { GoogleGenAI, Type } from "@google/genai";
import { Question, AnalysisResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is missing. Please set it in the .env.local file.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null as any;

// Helper to encode Blob to Base64
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

export const generateQuestions = async (role: string): Promise<Question[]> => {
  if (!apiKey) return mockQuestions(role);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 common interview questions for a ${role} position. 
      The questions should be diverse (behavioral, technical, situational).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ["id", "text"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    return JSON.parse(text) as Question[];
  } catch (error) {
    console.error("Error generating questions:", error);
    return mockQuestions(role);
  }
};

export const analyzeAnswer = async (question: string, audioBlob: Blob): Promise<AnalysisResult> => {
  if (!apiKey) return mockAnalysis();

  try {
    const base64Audio = await blobToBase64(audioBlob);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are an expert interviewer. Analyze the user's audio answer to the interview question: "${question}".
            1. Transcribe the audio accurately.
            2. Provide 3 specific, constructive feedback points on content, clarity, or structure.
            3. Identify 3-5 key professional terms used (or that should have been used).
            4. Give a rating: "Strong", "Good", or "Needs Practice".
            `
          },
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Audio
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            feedback: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            keyTerms: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            rating: { type: Type.STRING }
          },
          required: ["transcript", "feedback", "keyTerms", "rating"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from analysis");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing answer:", error);
    // Fallback for demo if API fails or limits hit
    return mockAnalysis();
  }
};

// Provide a speech generation helper that now proxies to the serverless /api/tts route.
// Returns base64 MP3 audio (or null if unavailable). This replaces prior Gemini TTS approach.
export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text.trim()) return null;
  try {
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => ({}));
    return (data as any).audioBase64 || null;
  } catch {
    return null;
  }
};

// Fallback data
const mockQuestions = (role: string): Question[] => [
  { id: '1', text: `Tell me about a time you faced a challenge in ${role}.` },
  { id: '2', text: `Why are you interested in a career in ${role}?` },
  { id: '3', text: "Describe a successful project you worked on." },
];

const mockAnalysis = (): AnalysisResult => ({
  transcript: "This is a simulated transcript because the API call failed or no key was provided. I talked about my experience with leading teams and solving complex data problems.",
  feedback: [
    "Try to use the STAR method (Situation, Task, Action, Result) more explicitly.",
    "Your tone was confident, which is great.",
    "Mention specific tools or technologies you utilized."
  ],
  keyTerms: ["Leadership", "Data Analysis", "Problem Solving"],
  rating: "Good"
});