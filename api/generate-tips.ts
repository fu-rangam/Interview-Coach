import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { question, role } = req.body || {};

    if (!question || !role) {
        return res.status(400).json({ error: 'Missing "question" or "role" in request body' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Server Error: GEMINI_API_KEY is missing");
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    You are an expert interview coach for ${role} roles.
    Provide detailed interview tips for the following question: "${question}"

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
        return res.status(500).json({ error: 'Failed to generate tips', details: error.message });
    }
}
