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

        const { question, input, blueprint, questionId } = req.body || {};

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

            // Context Construction
            let contextContext = "";
            let scoringModelContext = "";
            let questionContext = `Question: "${question}"`;

            if (blueprint) {
                // Enhanced Context
                contextContext = `
BLUEPRINT CONTEXT:
Job Role: ${blueprint.role.title}
Competencies: ${JSON.stringify(blueprint.competencies.map(c => ({ id: c.id, name: c.name, definition: c.definition })))}
`;
                if (blueprint.scoringModel) {
                    scoringModelContext = `
SCORING MODEL:
Dimensions: ${JSON.stringify(blueprint.scoringModel.dimensions)}
Ratings Bands: ${JSON.stringify(blueprint.scoringModel.ratingBands)}
`;
                }
            }

            const readingLevelContext = blueprint?.readingLevel
                ? `
    READING LEVEL INSTRUCTIONS:
    - Mode: ${blueprint.readingLevel.mode}
    - Max Sentence Words: ${blueprint.readingLevel.maxSentenceWords}
    - Avoid Jargon: ${blueprint.readingLevel.avoidJargon}
    - Adapt all feedback (notes, tips, reaction) to this level.
        `
                : (blueprint ? `
    IMPORTANT: Adapt the reading level of your feedback to the target candidate profile for a ${blueprint.role.title}.
    - If the role is entry-level (e.g., Cashier): STRICTLY use a 6th-7th grade reading level. Keep sentences short and simple.
    - If the role is highly technical/executive: Use appropriate professional terminology but keep phrasing clear.
    - When in doubt: Prioritize simplicity.
        ` : "");

            const commonPromptInstructions = `
${readingLevelContext}
1. Analyze the user's answer.
2. ${contextContext ? "Map answer to the relevant competency defined in the Blueprint." : ""}
3. Identify 3-5 key professional terms used.
4. Give a rating (Strong/Good/Developing) based on the quality and the provided scoring model.
5. Provide numeric scores (0-100) for each dimension if a scoring model is provided, otherwise provide a holistic score.
6. Extract 1-3 specific evidence snippets from the answer that support the score.
7. Identify 1-3 missing elements or areas for improvement (missingElements).
8. GENERATE A "MICRO-ACKNOWLEDGEMENT" (coachReaction):
   - Short (5-7 words), positive, specific.
9. GENERATE "ONE BIG UPGRADE" (biggestUpgrade):
   - **CRITICAL**: Select the **SINGLE most critical item** from the 'missing elements' list above.
   - Explain *why* it matters in 1 sentence.
10. GENERATE "WHY THIS WORKS" Analysis.
11. GENERATE "Try Saying This" (redoPrompt):
    - WRITE A DIRECT QUOTE of a better way to phrase a specific part of the answer.
    - **CRITICAL**: This quote must **SPECIFICALLY ADDRESS** the 'One Big Upgrade' identified above to show the user how to fix it.
    - Do NOT write advice ("You should say..."). Write the actual words ("In my previous role, I...").
12. SCORING INSTRUCTIONS:
    - For \`dimensionScores\`, YOU MUST USE THE EXACT \`id\` values from the provided SCORING MODEL (e.g., "tech_depth", "comm_style").
    - **CRITICAL**: Only score dimensions that are **RELEVANT** to the specific question asked.
      - Example: If the question is "How do you clean a floor?" (Technical), do NOT score "Teamwork" or "Leadership".
      - **ACTION**: If a dimension is irrelevant, **OMIT IT** from the \`dimensionScores\` array entirely. Do not score it as 0.
    - Do NOT invent new IDs. Do NOT use the string "dimensionId" as an ID.
    - If no scoring model is provided, use generic IDs: "Content", "Communication", "Impact".
    - **CRITICAL**: Write the "note" for each dimension in the **2nd PERSON** (addressing the user as "You").
      - BAD: "The candidate showed..."
      - GOOD: "You demonstrated strong..."
    - **FEEDBACK CONTENT RULES (note)**:
      - **Score 80-100**: Briefly validate the strength (1 sentence). Do NOT offer improvement advice.
      - **Score 60-79**: Briefly validate what was done well, THEN include **EXACTLY ONE** actionable sentence explaining what would make this dimension stronger.
      - **Score < 60**: Provide detailed constructive feedback (removes length restriction) explaining the gap and exactly what is needed for a strong answer.
${scoringModelContext}
        `;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    transcript: { type: Type.STRING },
                    feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
                    deliveryStatus: { type: Type.STRING, nullable: true },
                    deliveryTips: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                    keyTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    rating: { type: Type.STRING },

                    // New Fields
                    answerScore: { type: Type.NUMBER },
                    dimensionScores: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                dimensionId: { type: Type.STRING, description: "Must match ID from Scoring Model. Omit if irrelevant." },
                                score: { type: Type.NUMBER },
                                note: { type: Type.STRING }
                            }
                        }
                    },
                    evidenceExtracts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    biggestUpgrade: { type: Type.STRING },
                    redoPrompt: { type: Type.STRING },

                    coachReaction: { type: Type.STRING },
                    strongResponse: { type: Type.STRING },
                    whyThisWorks: {
                        type: Type.OBJECT,
                        properties: {
                            lookingFor: { type: Type.STRING },
                            pointsToCover: { type: Type.ARRAY, items: { type: Type.STRING } },
                            answerFramework: { type: Type.STRING },
                            industrySpecifics: {
                                type: Type.OBJECT,
                                properties: {
                                    metrics: { type: Type.STRING },
                                    tools: { type: Type.STRING }
                                }
                            },
                            mistakesToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                            proTip: { type: Type.STRING }
                        }
                    }
                },
                required: ["transcript", "feedback", "rating", "coachReaction", "strongResponse", "whyThisWorks"]
            };

            if (typeof input === 'string') {
                // Text Input Analysis
                contentParts = [
                    {
                        text: `You are a supportive interview coach.
          ${questionContext}
          User's Text Answer: "${input}"
          
          Task:
          0. Since this is a text answer, the transcript is the answer itself.
          ${commonPromptInstructions}
          (Skip delivery analysis for text interactions).
`
                    }
                ];
            } else if (input.data && input.mimeType) {
                // Audio Input Analysis
                contentParts = [
                    {
                        text: `You are a supportive interview coach.
          ${questionContext}

          Task:
          0. Transcribe the audio accurately.
          ${commonPromptInstructions}
          7. Analyze delivery, tone, and pace.
             - "deliveryStatus": summarized in 1-2 words.
             - "deliveryTips": 2 specific tips.
             - Context: Voice-only interaction.
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
                    responseSchema: schema
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
