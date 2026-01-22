import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from './utils/auth';
import { InitSessionSchema } from './schemas.js';
import { logger } from './utils/logger.js';

export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await validateUser(req);

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const parseResult = InitSessionSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res
                .status(400)
                .json({ error: 'Invalid request body', details: parseResult.error.format() });
        }

        const { role, jobDescription, intakeData } = parseResult.data;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const ai = new GoogleGenAI({ apiKey });

        let intakeContext = '';
        if (intakeData) {
            intakeContext = `
            USER PREFERENCES (INTAKE):
            - Confidence Level: ${intakeData.confidenceScore}/5 (Adapt tone accordingly)
            - Biggest Struggle: ${intakeData.biggestStruggle} (Focus help here)
            - Challenge Level: ${intakeData.challengeLevel} (Adjust difficulty)
            - Goal: ${intakeData.primaryGoal}
            - Stage: ${intakeData.stage}
            - Must Practice: ${intakeData.mustPracticeQuestions?.join(', ') || 'None'}
            `;
        }

        const prompt = `
        ACT AS: Expert Interview Coach.
        TASK: Prepare an interview session for a candidate applying for: "${role}".
        CONTEXT: ${jobDescription ? `Job Description: ${jobDescription}` : 'General Role'}
        ${intakeContext}

        YOU MUST GENERATE 3 THINGS IN ONE JSON OBJECT:
        1. "blueprint": A Competency Blueprint (5 key competencies for this role).
        2. "questionPlan": A plan for 5 questions (mapping competencies to question types).
        3. "firstQuestion": The FULL TEXT of the FIRST question from the plan.

        REQUIREMENTS:
        - Blueprint: 5 competencies.
        - Plan: 5 questions.
        - First Question: Must match the first item in the plan.
        - Reading Level: Adapt to role (Simple for entry, Professional for senior).
        - IF "Must Practice" questions are provided, INJECT them into the Question Plan where relevant (replacing generic ones).
        - IF "Challenge Level" is "challenge", increase difficulty of questions.
        - IF "Challenge Level" is "warm_up", keep questions encouraging and simpler.

        OUTPUT SCHEMA:
        {
          "blueprint": {
             "role": { "title": string, "level": string },
             "competencies": [ { "id": string, "name": string, "definition": string } ],
             "readingLevel": { "mode": string, "maxSentenceWords": number, "avoidJargon": boolean },
             "scoringModel": { "dimensions": [...], "ratingBands": [...] }
          },
          "questionPlan": {
             "questions": [
               { "id": "q1", "competencyId": string, "type": "Behavioral" | "Technical" | "Situational", "difficulty": string, "intent": string }
             ]
          },
          "firstQuestion": { "id": "q1", "text": string }
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        blueprint: {
                            type: Type.OBJECT,
                            properties: {
                                role: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        seniority: { type: Type.STRING },
                                    },
                                    required: ['title'],
                                },
                                readingLevel: {
                                    type: Type.OBJECT,
                                    properties: {
                                        mode: { type: Type.STRING },
                                        maxSentenceWords: { type: Type.INTEGER },
                                        avoidJargon: { type: Type.BOOLEAN },
                                    },
                                    required: ['mode', 'maxSentenceWords', 'avoidJargon'],
                                },
                                competencies: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING },
                                            name: { type: Type.STRING },
                                            definition: { type: Type.STRING },
                                            signals: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            evidenceExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            weight: { type: Type.INTEGER },
                                            bands: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    Developing: { type: Type.STRING },
                                                    Good: { type: Type.STRING },
                                                    Strong: { type: Type.STRING },
                                                },
                                                required: ['Developing', 'Good', 'Strong'],
                                            },
                                        },
                                        required: [
                                            'id',
                                            'name',
                                            'definition',
                                            'signals',
                                            'evidenceExamples',
                                            'weight',
                                            'bands',
                                        ],
                                    },
                                },
                                scoringModel: {
                                    type: Type.OBJECT,
                                    properties: {
                                        dimensions: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    name: { type: Type.STRING },
                                                    weight: { type: Type.INTEGER },
                                                },
                                                required: ['id', 'name', 'weight'],
                                            },
                                        },
                                        ratingBands: {
                                            type: Type.OBJECT,
                                            properties: {
                                                Developing: {
                                                    type: Type.OBJECT,
                                                    properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER } },
                                                    required: ['min', 'max'],
                                                },
                                                Good: {
                                                    type: Type.OBJECT,
                                                    properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER } },
                                                    required: ['min', 'max'],
                                                },
                                                Strong: {
                                                    type: Type.OBJECT,
                                                    properties: { min: { type: Type.INTEGER }, max: { type: Type.INTEGER } },
                                                    required: ['min', 'max'],
                                                },
                                            },
                                            required: ['Developing', 'Good', 'Strong'],
                                        },
                                    },
                                    required: ['dimensions', 'ratingBands'],
                                },
                            },
                            required: ['role', 'readingLevel', 'competencies', 'scoringModel'],
                        },
                        questionPlan: {
                            type: Type.OBJECT,
                            properties: {
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING },
                                            competencyId: { type: Type.STRING },
                                            type: { type: Type.STRING },
                                            difficulty: { type: Type.STRING },
                                            intent: { type: Type.STRING },
                                        },
                                        required: ['id', 'competencyId', 'type', 'difficulty', 'intent'],
                                    },
                                },
                            },
                            required: ['questions'],
                        },
                        firstQuestion: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                            },
                            required: ['id', 'text'],
                        },
                    },
                    required: ['blueprint', 'questionPlan', 'firstQuestion'],
                },
            },
        });

        const text = response.text;
        if (!text) throw new Error('No text returned from Gemini');

        const result = JSON.parse(text);
        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Unified Init Error', error);
        return res.status(500).json({ error: 'Failed to initialize session', details: error.message });
    }
}
