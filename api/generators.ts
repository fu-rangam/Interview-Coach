import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from './utils/auth.js';
import { logger } from './utils/logger.js';
import handlerBlueprint from './_controllers/generate-blueprint.js';
import handlerQuestionPlan from './_controllers/generate-question-plan.js';
import handlerQuestions from './_controllers/generate-questions.js';
import handlerCoachPrep from './_controllers/coach-prep.js';
import handlerTips from './_controllers/generate-tips.js';
import handlerStrongResponse from './_controllers/generate-strong-response.js';

// Re-export the disparate handlers under one "super-handler"
// This forces Vercel to bundle them as a single Serverless Function
export default async function handler(req: any, res: any) {
    // CORS Preflight (Global)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type } = req.query;

    try {
        // 0. Auth Validation (Global)
        // Note: Individual handlers might re-validate, but that's okay (cheap)
        // Or we validate here and pass user down?
        // Most handlers call validateUser internally. Let's let them do it to keep logic intact.
        // However, to route, we need `type`.

        if (!type) {
            return res.status(400).json({ error: 'Missing "type" query parameter' });
        }

        logger.info(`[Generators] Routing request for type: ${type}`);

        switch (type) {
            case 'blueprint':
                return await handlerBlueprint(req, res);
            case 'question-plan':
                return await handlerQuestionPlan(req, res);
            case 'questions':
                return await handlerQuestions(req, res);
            case 'coach-prep':
                return await handlerCoachPrep(req, res);
            case 'tips':
                return await handlerTips(req, res);
            case 'strong-response':
                return await handlerStrongResponse(req, res);
            default:
                return res.status(400).json({ error: `Unknown generator type: ${type}` });
        }
    } catch (error: any) {
        logger.error('[Generators] Router Error', error);
        return res.status(500).json({ error: 'Internal Router Error', details: error.message });
    }
}
