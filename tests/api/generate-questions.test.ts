import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/generate-questions';

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

// Mock Auth logic
vi.mock('../../api/utils/auth', () => ({
    validateUser: vi.fn().mockResolvedValue({ id: 'test-user' })
}));
vi.mock('../../api/utils/auth.js', () => ({
    validateUser: vi.fn().mockResolvedValue({ id: 'test-user' })
}));

describe('Generate Questions API Handler', () => {
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
                role: 'Software Engineer'
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
            mockReq.body = {};

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "role" in request body' });
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
        it('should use basic prompt when no JD is provided', async () => {
            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify([{ id: '1', text: 'Test?' }])
            });

            await handler(mockReq, mockRes);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('Generate 5 common interview questions')
            }));
        });

        it('should use JD-specific prompt when JD is provided', async () => {
            mockReq.body.jobDescription = 'Must know React.';
            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify([{ id: '1', text: 'Test?' }])
            });

            await handler(mockReq, mockRes);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('based on this job description')
            }));
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('Must know React.')
            }));
        });

        it('should return valid question objects', async () => {
            const mockQuestions = [
                { id: '1', text: 'Q1' },
                { id: '2', text: 'Q2' },
                { id: '3', text: 'Q3' },
                { id: '4', text: 'Q4' },
                { id: '5', text: 'Q5' }
            ];

            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify(mockQuestions)
            });

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockQuestions);
        });
    });

    describe('Reading Level Adaptation', () => {
        it('should include scale instructions in the prompt', async () => {
            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify([{ id: '1', text: 'Test?' }])
            });

            await handler(mockReq, mockRes);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('6th-7th grade reading level')
            }));
        });
    });

    describe('Error Handling', () => {
        it('should handle empty response from Gemini', async () => {
            mockGenerateContent.mockResolvedValue({ text: '' });

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Failed to generate questions'
            }));
        });

        it('should handle AI service failure', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Quota Exceeded'));

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                details: 'Quota Exceeded'
            }));
        });
    });
});
