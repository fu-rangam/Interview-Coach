import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/generate-tips';

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
    }
}));

describe('Generate Tips API Handler', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock response object
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        // Mock request object (default happy path)
        mockReq = {
            method: 'POST',
            body: {
                role: 'Software Engineer',
                question: 'Tell me about yourself'
            },
        };

        // Set environment variable
        process.env.GEMINI_API_KEY = 'test-api-key';
    });

    describe('Validation', () => {
        it('should reject non-POST requests', async () => {
            mockReq.method = 'GET';

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(405);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
        });

        it('should reject requests missing role', async () => {
            mockReq.body = { question: 'test' };

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "question" or "role" in request body' });
        });

        it('should reject requests missing question', async () => {
            mockReq.body = { role: 'test' };

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "question" or "role" in request body' });
        });

        it('should reject requests when API key is missing', async () => {
            delete process.env.GEMINI_API_KEY;
            delete process.env.VITE_GEMINI_API_KEY;

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('Missing API Key')
            }));
        });
    });

    describe('Generation Logic', () => {
        it('should construct prompt with role and question', async () => {
            const mockResult = {
                lookingFor: "Experience",
                pointsToCover: ["Exp", "Skills"],
                answerFramework: "STAR",
                industrySpecifics: { metrics: "KPIs", tools: "IDE" },
                mistakesToAvoid: ["Bad grammar"],
                proTip: "Confidence"
            };

            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify(mockResult)
            });

            await handler(mockReq, mockRes);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('Software Engineer')
            }));
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('Tell me about yourself')
            }));

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockResult);
        });
    });

    describe('Error Handling', () => {
        it('should handle empty response from Gemini', async () => {
            mockGenerateContent.mockResolvedValue({ text: '' });

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Failed to generate tips'
            }));
        });

        it('should handle AI service failure', async () => {
            mockGenerateContent.mockRejectedValue(new Error('AI Overloaded'));

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                details: 'AI Overloaded'
            }));
        });
    });
});
