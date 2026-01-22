import { z } from 'zod';

export const IntakeDataSchema = z
    .object({
        confidenceScore: z.number().int().min(1).max(5).optional(),
        biggestStruggle: z.string().optional(),
        challengeLevel: z.enum(['warm_up', 'realistic', 'challenge']).optional(),
        primaryGoal: z.string().optional(),
        stage: z.string().optional(),
        mustPracticeQuestions: z.array(z.string()).optional(),
    })
    .optional();

export const InitSessionSchema = z.object({
    role: z.string().min(1, 'Role is required'),
    jobDescription: z.string().optional(),
    intakeData: IntakeDataSchema,
});

// QuestionPlan schema (minimal validation for structural integrity)
const QuestionPlanSchema = z
    .object({
        questions: z.array(
            z.object({
                id: z.string(),
                competencyId: z.string().optional(),
                type: z.string().optional(),
                difficulty: z.string().optional(),
                intent: z.string().optional(),
            })
        ),
    })
    .optional();

// Blueprint schema (validating readingLevel which is used in logic)
const BlueprintSchema = z
    .object({
        role: z
            .object({
                title: z.string().optional(),
                seniority: z.string().optional(),
            })
            .optional(),
        readingLevel: z
            .object({
                mode: z.string(),
                maxSentenceWords: z.number(),
                avoidJargon: z.boolean(),
            })
            .optional(),
        scoringModel: z
            .object({
                dimensions: z.array(z.any()).optional(),
                ratingBands: z.any().optional(),
            })
            .optional()
            .or(z.any()), // Allow loose structure for complex nested objects
        competencies: z
            .array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    definition: z.string(),
                })
            )
            .optional(),
    })
    .passthrough()
    .optional();

export const GenerateQuestionsSchema = z.object({
    role: z.string().min(1, 'Role is required'),
    jobDescription: z.string().optional(),
    questionPlan: QuestionPlanSchema,
    blueprint: BlueprintSchema,
    subsetIndices: z.array(z.number()).optional(),
    intakeData: IntakeDataSchema,
});

export const AnalyzeAnswerSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    input: z.union([
        z.string().min(1), // Text input
        z.object({
            // Audio input
            data: z.string().min(1),
            mimeType: z.string().optional(),
        }),
    ]),
    blueprint: BlueprintSchema,
    questionId: z.string().optional(),
    intakeData: IntakeDataSchema,
});
