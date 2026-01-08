import { GoogleGenAI, Type } from "@google/genai";
import { validateUser } from "./utils/auth.js";

export default async function handler(req, res) {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 1. Auth Validation
        await validateUser(req);

        // 2. Input Validation
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { question, input } = req.body || {};

        if (!question || !input) {
            return res.status(400).json({ error: 'Missing "question" or "input" in request body' });
        }


        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Server Error: GEMINI_API_KEY is missing");
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const ai = new GoogleGenAI({ apiKey });

        try {
            let contentParts = [];

            const commonPromptInstructions = `
1. Analyze the user's answer.
2. Provide 3 balanced feedback points(highlighting strengths + areas for improvement).
          3. Identify 3 - 5 key professional terms used(or that should have been used).
          4. Give a rating: "Strong", "Good", or "Developing".
        `;

            if (typeof input === 'string') {
                // Text Input Analysis
                contentParts = [
                    {
                        text: `You are a supportive and encouraging interview coach.
          Interview Question: "${question}".

    User's Text Answer: "${input}"

Task:
0. Since this is a text answer, the transcript is the answer itself.
    ${commonPromptInstructions}
`
                    }
                ];
            } else if (input.data && input.mimeType) {
                // Audio Input Analysis
                contentParts = [
                    {
                        text: `You are a supportive and encouraging interview coach.
          Interview Question: "${question}".

    Task:
0. Transcribe the audio accurately.
    ${commonPromptInstructions}
7. Analyze delivery, tone, and pace.
             - Status: summarized in 1 - 2 words(e.g., "Confident", "Too Fast").
             - Tips: 2 specific tips to improve delivery.
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
    } catch (error) {
        console.error("Handler Error:", error);
        // Return 401 if it's an Auth error, otherwise 500
        if (error.message.includes("Authorization") || error.message.includes("Token")) {
            return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
