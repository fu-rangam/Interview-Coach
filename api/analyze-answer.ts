import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { question, input } = req.body || {};

    if (!question || !input) {
        return res.status(400).json({ error: 'Missing "question" or "input" in request body' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Server Error: GEMINI_API_KEY is missing");
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        let contentParts = [];

        if (typeof input === 'string') {
            // Text Input Analysis
            contentParts = [
                {
                    text: `You are a supportive and encouraging interview coach. Analyze the user's text answer to the interview question: "${question}".
          
          User's Answer: "${input}"

          1. Since this is a text answer, the transcript is the answer itself.
          2. Provide 3 balanced feedback points (highlighting strengths + areas for improvement). Be constructive but kind.
          3. Identify 3-5 key professional terms used (or that should have been used).
          4. Give a rating: "Strong", "Good", or "Developing".
          `
                }
            ];
        } else if (input.data && input.mimeType) {
            // Audio Input Analysis (expects { mimeType, data: base64string })
            contentParts = [
                {
                    text: `You are a supportive and encouraging interview coach. Analyze the user's audio answer to the interview question: "${question}".
          1. Transcribe the audio accurately.
          2. Provide 3 balanced feedback points (highlighting strengths + areas for improvement). Be constructive but kind.
          3. Analyze the delivery, tone, and pace.
             - Status: summarized in 1-2 words (e.g., "Confident", "Too Fast", "Monotone").
             - Tips: 2 specific tips on how to improve delivery (e.g., "Slow down slightly," "Vary your pitch"). Keep these helpful, not harsh.
          4. Identify 3-5 key professional terms used (or that should have been used).
          5. Give a rating: "Strong", "Good", or "Developing".
          `
                },
                {
                    inlineData: {
                        mimeType: input.mimeType || 'audio/webm',
                        data: input.data
                    }
                }
            ];
        } else {
            return res.status(400).json({ error: 'Invalid input format' });
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
                        deliveryStatus: { type: Type.STRING, nullable: true },
                        deliveryTips: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            nullable: true
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

        const result = JSON.parse(text);
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error analyzing answer:", error);
        return res.status(500).json({ error: 'Failed to analyze answer', details: error.message });
    }
}
