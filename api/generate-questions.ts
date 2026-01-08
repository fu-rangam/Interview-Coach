import { GoogleGenAI, Type } from "@google/genai";
import { validateUser } from "./utils/auth.js";

export default async function handler(req, res) {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 0. Auth Validation
        await validateUser(req);

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { role, jobDescription } = req.body || {};

        if (!role) {
            return res.status(400).json({ error: 'Missing "role" in request body' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Server Error: GEMINI_API_KEY is missing");
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const ai = new GoogleGenAI({ apiKey });

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

            const questions = JSON.parse(text);
            return res.status(200).json(questions);

        } catch (error) {
            console.error("Error generating questions:", error);
            return res.status(500).json({ error: 'Failed to generate questions', details: error.message });
        }
    } catch (error) {
        console.error("Handler Error:", error);
        if (error.message.includes("Authorization") || error.message.includes("Token")) {
            return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
