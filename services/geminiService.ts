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

// --- API Functions ---

export const generateQuestions = async (role: string, jobDescription?: string): Promise<Question[]> => {
  if (!apiKey) return mockQuestions(role);

  const readingLevelInstruction = `
    IMPORTANT: Adapt the reading level of the questions to the target candidate profile for a ${role}.
    - If the role is entry-level (e.g., Cashier): STRICTLY use a 6th-7th grade reading level.
      - Tone: Professional but accessible. Use standard workplace English, not 'child-speak.'
      - Vocabulary: It is okay to use standard job terms like 'payment,' 'customer,' 'receipt,' and 'transaction.'
      - Structure: Sentences must be short (under 15 words). Avoid complex clauses.
      - Constraint: Avoid corporate jargon (e.g., 'synergy,' 'optimization'), but do not over-simplify common concepts (e.g., say 'handle a return,' not 'help people give back items').
    - If the role is highly technical/executive: Use appropriate professional terminology but keep phrasing clear.
    - When in doubt: Prioritize simplicity.
`;

  const prompt = jobDescription
    ? `Generate 5 interview questions for a ${role} position based on this job description:\n\n${jobDescription}\n\nQuestions should test skills mentioned in the JD. Return strictly JSON.`
    : `Generate 5 common interview questions for a ${role} position. The questions should be diverse (behavioral, technical, situational). Return strictly JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${readingLevelInstruction}\n\n${prompt}`,
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

export const analyzeAnswer = async (question: string, input: Blob | string): Promise<AnalysisResult> => {
  if (!apiKey) return mockAnalysis();

  try {
    let contentParts: any[] = [];

    if (typeof input === 'string') {
      // Text Input Analysis
      contentParts = [
        {
          text: `You are an expert interviewer. Analyze the user's text answer to the interview question: "${question}".
          
          User's Answer: "${input}"

          1. Since this is a text answer, the transcript is the answer itself.
          2. Provide 3 specific, constructive feedback points on content, clarity, or structure.
          3. Identify 3-5 key professional terms used (or that should have been used).
          4. Give a rating: "Strong", "Good", or "Needs Practice".
          `
        }
      ];
    } else {
      // Audio Input Analysis
      const base64Audio = await blobToBase64(input);
      contentParts = [
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
            mimeType: input.type || 'audio/webm',
            data: base64Audio
          }
        }
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contentParts },
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

    // Convert the Base64 back to a Blob for playback
    const binaryString = atob(data.audioBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const mimeType = data.mimeType || 'audio/mpeg';
    console.log(`[Client] Received TTS Audio. MimeType: ${mimeType}, Length: ${len} bytes`);

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    console.log(`[Client] Created Blob URL: ${url}`);

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