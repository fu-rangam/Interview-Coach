import { GoogleGenAI, Type } from "@google/genai";
import { Question, AnalysisResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("CRITICAL ERROR: VITE_GEMINI_API_KEY is missing in .env.local");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null as any;

// --- Helpers ---

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

// Create a WAV header for the raw PCM data from Gemini
// Spec: 24kHz, 1 channel, 16-bit PCM (Linear16)
const createWavHeader = (dataLength: number): ArrayBuffer => {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // File size - 8
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true);  // NumChannels (1)
  view.setUint32(24, 24000, true); // SampleRate (24kHz for Gemini TTS)
  view.setUint32(28, 24000 * 2, true); // ByteRate (SampleRate * BlockAlign)
  view.setUint16(32, 2, true);  // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  return buffer;
};

// --- API Functions ---

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
    return mockAnalysis();
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text.trim()) return null;

  try {
    console.log("Fetching speech from server for:", text.substring(0, 15) + "...");
    
    // Call your own serverless function
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.audioBase64) {
      throw new Error("No audio data returned from server");
    }

    // Convert the WAV Base64 back to a Blob for playback
    // (The server already added the WAV header!)
    const binaryString = atob(data.audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    return url;

  } catch (error) {
    console.error("TTS Fetch Error:", error);
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