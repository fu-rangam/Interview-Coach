import { GoogleGenAI, Type } from '@google/genai';
import { validateUser } from './utils/auth.js';
import { logger } from '../src/utils/logger';

export default async function handler(req: any, res: any) {
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

    const { question, tips } = req.body || {};

    if (!question || !tips) {
      return res.status(400).json({ error: 'Missing "question" or "tips" in request body' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Server Error: GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Helper to format tips for the prompt
    let tipsContext = `
        Use the following coaching tips as the standard for your analysis and generation:
        - What they're looking for: "${tips.lookingFor}"
        - Points to cover: ${JSON.stringify(tips.pointsToCover)}
        - Answer framework: "${tips.answerFramework}"
        - Industry specifics: ${JSON.stringify(tips.industrySpecifics)}
        - Mistakes to avoid: ${JSON.stringify(tips.mistakesToAvoid)}
        - Pro tip: "${tips.proTip}"
        `;

    try {
      const contentParts = [
        {
          text: `You are an expert interview coach.
          Interview Question: "${question}".
          
          ${tipsContext}

          Task:
          1. GENERATE A STRONG RESPONSE: Create a hypothetical "Strong" (10/10) answer to this question. 
             - It MUST explicitly follow the provided "Answer Framework" and "Points to Cover".
             - It should be natural, professional, and ~150-200 words.
          2. GENERATE "WHY THIS WORKS": Explain why your generated strong response is effective by mapping it back to the specific categories in the coaching tips.
             - Fill out a structure IDENTICAL to the input tips, but the content should be your explanation of how the strong response meets that criteria.
          `,
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
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
            required: ['strongResponse', 'whyThisWorks'],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('No text returned from strong response generation');

      const result = JSON.parse(text);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error generating strong response', error);
      if (error.message.includes('Authorization') || error.message.includes('Token')) {
        return res.status(401).json({ error: error.message });
      }
      return res
        .status(500)
        .json({ error: 'Failed to generate strong response', details: error.message });
    }
  } catch (error: any) {
    // Catch block for errors from validateUser or other top-level operations
    logger.error('Handler error', error);
    if (error.message.includes('Authorization') || error.message.includes('Token')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
