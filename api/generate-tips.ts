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

        const { question, role, competency } = req.body || {};

        if (!question || !role) {
            return res.status(400).json({ error: 'Missing "question" or "role" in request body' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Server Error: GEMINI_API_KEY is missing");
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Competency-Driven Context
        let competencyContext = "";
        if (competency) {
            competencyContext = `
            COMPETENCY FOCUS: ${competency.name}
            DEFINITION: ${competency.definition}
            SIGNALS (Points to Cover): ${competency.signals?.join('; ') || "N/A"}
            DEVELOPING BEHAVIOR (Mistakes): ${competency.bands?.Developing || "N/A"}
            STRONG BEHAVIOR (Pro Tip): ${competency.bands?.Strong || "N/A"}
            
            INSTRUCTIONS:
            - "lookingFor": Use the Definition.
            - "pointsToCover": Simplify the Signals into bullet points.
            - "mistakesToAvoid": Base this on the Developing behavior (what NOT to do).
            - "proTip": Base this on the Strong behavior (what TO do).
            `;
        }

        const prompt = `
    You are an expert interview coach for ${role} roles.
    Provide detailed interview tips for the following question: "${question}"

    ${competencyContext}

    Return strictly JSON matching this structure:
    {
       lookingFor: "What the interviewer is trying to assess",
       pointsToCover: ["Point 1", "Point 2", "Point 3"],
       answerFramework: "Recommended structure (e.g. STAR, Past-Present-Future)",
       industrySpecifics: { metrics: "Key KPIs to mention", tools: "Relevant software/tools" },
       mistakesToAvoid: ["Mistake 1", "Mistake 2", "Mistake 3"],
       proTip: "One advanced insight or unique tip"
    }
  `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            lookingFor: { type: Type.STRING },
                            pointsToCover: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            answerFramework: { type: Type.STRING },
                            industrySpecifics: {
                                type: Type.OBJECT,
                                properties: {
                                    metrics: { type: Type.STRING },
                                    tools: { type: Type.STRING }
                                }
                            },
                            mistakesToAvoid: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            proTip: { type: Type.STRING }
                        },
                        required: ["lookingFor", "pointsToCover", "answerFramework", "industrySpecifics", "mistakesToAvoid", "proTip"]
                    },
                }
            });

            const text = response.text;
            if (!text) throw new Error("No text returned from Gemini for tips");

            const tips = JSON.parse(text);
            return res.status(200).json(tips);

        } catch (error) {
            console.error("Error generating tips:", error);
            if (error.message.includes("Authorization") || error.message.includes("Token")) {
                return res.status(401).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Failed to generate tips', details: error.message });
        }
    } catch (error) {
        console.error("Error in handler:", error);
        if (error.message.includes("Authorization") || error.message.includes("Token")) {
            return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
