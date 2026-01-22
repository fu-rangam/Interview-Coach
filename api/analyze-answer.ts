import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from './utils/auth.js';
import { AnalyzeAnswerSchema } from './schemas.js';
import { logger } from './utils/logger.js';

export default async function handler(req: any, res: any) {
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

        const parseResult = AnalyzeAnswerSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res
                .status(400)
                .json({ error: 'Invalid request body', details: parseResult.error.format() });
        }

        const { question, input, blueprint, questionId, intakeData } = parseResult.data;

        // 3. Payload Size Check
        // Limit base64 payload to prevent memory abuse (approx 10MB)
        const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;
        if (typeof input !== 'string' && input.data && input.data.length > MAX_PAYLOAD_SIZE) {
            logger.warn(`Blocked large payload: ${input.data.length} bytes`);
            return res.status(413).json({ error: 'Payload Too Large' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            logger.error('Server Error: GEMINI_API_KEY is missing');
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        const ai = new GoogleGenAI({ apiKey });

        try {
            let contentParts = [];

            // Context Construction
            let contextContext = '';
            let scoringModelContext = '';
            let questionContext = `Question: "${question}"`;

            if (blueprint) {
                // Enhanced Context
                contextContext = `
BLUEPRINT CONTEXT:
Job Role: ${blueprint.role?.title || 'Unknown Role'}
Competencies: ${JSON.stringify(blueprint.competencies?.map((c) => ({ id: c.id, name: c.name, definition: c.definition })))}
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
    READING LEVEL (Mode: ${blueprint.readingLevel.mode}):
    - STRICT CONSTRAINT: Simplify ALL output.
    - Max ${blueprint.readingLevel.maxSentenceWords} words/sentence.
    - NO corporate jargon (e.g., "leverage", "utilize", "synergy", "stakeholders", "alignment").
    - Use everyday language.
    - Feedback must be understood by a ${blueprint.readingLevel.mode === 'Simple' ? '12-year-old' : 'high school student'}.
    
    CRITICAL: Apply these reading constraints to ALL generated text, especially:
    1. "strongResponse" & "redoPrompt"
    2. "feedback" & "biggestUpgrade" (Use clear, direct advice)
    3. "coachReaction"
    4. "dimensionScores" notes
    5. "missingElements" (Be plain and direct)
        `
                : blueprint
                    ? `
    IMPORTANT: Adapt the reading level of your feedback to the target candidate profile for a ${blueprint.role?.title || 'candidate'}.
    - If the role is entry-level: STRICTLY use a 6th-7th grade reading level. Max 15 words/sentence. No big words.
    - If the role is senior: Use professional but clear language.
    - When in doubt: Prioritize simplicity.
        `
                    : '';

            // Confidence / Struggle Context
            let struggleContext = '';

            if (intakeData?.biggestStruggle) {
                const s = intakeData.biggestStruggle;
                struggleContext = `
    CUSTOM FOCUS (User Struggle: "${s}"):
    - The user specifically wants help with: ${s}.
    - ${s === 'getting_started' ? 'Focus feedback on: How quickly they got to the point. Did they hesitate?' : ''}
    - ${s === 'staying_organized' ? 'Focus feedback on: Structure. Did they ramble? Penalize deviations strictly.' : ''}
    - ${s === 'explaining_impact' ? 'Focus feedback on: Concrete results. Did they mention numbers/outcomes?' : ''}
    - ${s === 'technical_depth' ? 'Focus feedback on: Technical terminology accuracy and depth.' : ''}
    - ${s === 'behavioral_storytelling' ? "Focus feedback on: STAR Method adherence. Was the 'Action' clear?" : ''}
    - ${s === 'weaknesses_gaps' ? 'Focus feedback on: Honesty + Pivot to growth. Did they sound defensive?' : ''}
    - ${s === 'nerves_anxiety' ? 'Focus feedback on: Tone and confidence markers. Be extra supportive.' : ''}
    
    ACTION: Ensure the "biggestUpgrade" and "coachReaction" specifically address this struggle if relevant.
                `;
            }

            // Challenge Level Context
            let challengeContext = '';
            if (intakeData?.challengeLevel) {
                const level = intakeData.challengeLevel;
                challengeContext = `
    GRADING STRINGENCY (Level: ${level}):
    - ${level === 'warm_up' ? 'Be encouraging. Overlook minor flaws. Focus on confidence.' : ''}
    - ${level === 'realistic' ? 'Fair professional standard. Flag obvious gaps.' : ''}
    - ${level === 'challenge' ? "RUTHLESS CRITIQUE. High bar for 'Strong'. Nitpick missing nuances. Assume they are applying for a Senior/Staff role." : ''}
                `;
            }

            // Primary Goal Context
            let goalContext = '';
            if (intakeData?.primaryGoal) {
                const goal = intakeData.primaryGoal;
                goalContext = `
    GOAL-DRIVEN FEEDBACK FOCUS (Goal: ${goal}):
    - ${goal === 'build_confidence' ? 'Be extra encouraging. Highlight strengths. Gentle on critique.' : ''}
    - ${goal === 'get_more_structured' ? 'Focus feedback on: Logical flow and organization. Did they use a framework (STAR, etc.)?' : ''}
    - ${goal === 'practice_star_stories' ? 'Focus feedback on: STAR adherence. Was the Situation clear? Action specific? Result measurable?' : ''}
    - ${goal === 'get_more_concise' ? 'Focus feedback on: Brevity. STRICTLY penalize rambling. Reward concise answers.' : ''}
    - ${goal === 'improve_metrics' ? 'Focus feedback on: Quantifiable results. Did they mention numbers, percentages, or measurable outcomes?' : ''}
    - ${goal === 'role_specific_depth' ? 'Focus feedback on: Technical accuracy and domain expertise for the role.' : ''}
    - ${goal === 'practice_hard_questions' ? 'High bar. Expect nuanced, sophisticated answers. Flag any superficiality.' : ''}
                `;
            }

            // Interview Stage Context
            let stageContext = '';
            if (intakeData?.stage) {
                const stage = intakeData.stage;
                stageContext = `
    INTERVIEW STAGE LENS (Stage: ${stage}):
    - ${stage === 'recruiter_screen' ? 'Evaluate for: basic fit, communication clarity, and culture alignment. Be encouraging.' : ''}
    - ${stage === 'hiring_manager' ? 'Evaluate for: role-specific competence, problem-solving, and team fit. Higher bar for technical depth.' : ''}
    - ${stage === 'panel' ? 'Evaluate for: handling multiple perspectives, cross-functional awareness, and collaboration skills.' : ''}
    - ${stage === 'final_round' ? 'Evaluate for: executive presence, strategic thinking, leadership potential, and culture add. Highest bar.' : ''}
                `;
            }

            const commonPromptInstructions = `

${struggleContext}
${challengeContext}
${goalContext}
${stageContext}
1. Analyze the user's answer.
2. ${contextContext ? 'Map answer to the relevant competency defined in the Blueprint.' : ''}
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
${readingLevelContext}
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
                    answerScore: { type: Type.NUMBER },
                    dimensionScores: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                dimensionId: {
                                    type: Type.STRING,
                                    description: 'Must match ID from Scoring Model. Omit if irrelevant.',
                                },
                                score: { type: Type.NUMBER },
                                note: { type: Type.STRING },
                            },
                        },
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
                                    tools: { type: Type.STRING },
                                },
                            },
                            mistakesToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                            proTip: { type: Type.STRING },
                        },
                    },
                },
                required: [
                    'transcript',
                    'feedback',
                    'rating',
                    'coachReaction',
                    'strongResponse',
                    'whyThisWorks',
                ],
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
`,
                    },
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
          `,
                    },
                    {
                        inlineData: {
                            mimeType: input.mimeType || 'audio/webm',
                            data: input.data,
                        },
                    },
                ];
            } else {
                return res.status(400).json({ error: 'Invalid input format' });
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: contentParts },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            });

            const text = response.text;
            if (!text) throw new Error('No text returned from analysis');

            const result = JSON.parse(text);
            return res.status(200).json(result);
        } catch (error: any) {
            logger.error('Error analyzing answer', error);
            return res.status(500).json({ error: 'Failed to analyze answer', details: error.message });
        }
    } catch (error: any) {
        logger.error('Handler Error', error);
        // Return 401 if it's an Auth error, otherwise 500
        if (error.message.includes('Authorization') || error.message.includes('Token')) {
            return res.status(401).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
