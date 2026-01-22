
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/init-session';

// Mock GoogleGenAI
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(function () {
        return {
            models: {
                generateContent: mockGenerateContent,
            },
        };
    }),
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        ARRAY: 'ARRAY',
        INTEGER: 'INTEGER',
        BOOLEAN: 'BOOLEAN'
    }
}));

// Mock Auth logic
vi.mock('../../api/utils/auth', () => ({
    validateUser: vi.fn().mockResolvedValue({ id: 'test-user' })
}));
vi.mock('../../api/utils/auth.js', () => ({
    validateUser: vi.fn().mockResolvedValue({ id: 'test-user' })
}));

describe('Init Session API Handler', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            end: vi.fn(),
        };

        mockReq = {
            method: 'POST',
            body: {
                role: 'Software Engineer',
                intakeData: {
                    confidenceScore: 3,
                    primaryGoal: 'practice_hard_questions',
                    stage: 'hiring_manager'
                }
            },
        };

        process.env.GEMINI_API_KEY = 'test-api-key';
    });

    it('should reject non-POST requests', async () => {
        mockReq.method = 'GET';
        await handler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(405);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
    });

    it('should reject requests missing role', async () => {
        mockReq.body.role = undefined;
        await handler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "role" in request body' });
    });

    it('should successfully generate initial session data', async () => {
        const mockResponse = {
            blueprint: { role: { title: 'Engineer' } },
            questionPlan: { questions: [{ id: 'q1', text: 'Hello' }] },
            firstQuestion: { id: 'q1', text: 'Hello' }
        };

        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(mockResponse)
        });

        await handler(mockReq, mockRes);

        expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
            contents: expect.stringContaining('Software Engineer')
        }));

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
        mockGenerateContent.mockRejectedValue(new Error('API Error'));
        await handler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Failed to initialize session'
        }));
    });
});
