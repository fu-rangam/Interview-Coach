import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/analyze-answer';

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
        NUMBER: 'NUMBER'
    }
}));

// Mock Auth
vi.mock('../../api/utils/auth', () => ({
    validateUser: vi.fn().mockResolvedValue({ id: 'test-user' })
}));
vi.mock('../../api/utils/auth.js', () => ({
    validateUser: vi.fn().mockResolvedValue({ id: 'test-user' })
}));

describe('Analyze Answer API Handler', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock response object
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };

        // Mock request object (default happy path for text)
        mockReq = {
            method: 'POST',
            body: {
                question: 'Tell me about yourself',
                input: 'I am a software engineer with 5 years of experience.'
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

        it('should reject requests with missing body fields', async () => {
            mockReq.body = { question: 'test' }; // Missing 'input'

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "question" or "input" in request body' });
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

        it('should reject invalid input format', async () => {
            mockReq.body = { question: 'test', input: { some: 'garbage' } };

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid input format' });
        });

        it('should reject audio payloads exceeding 10MB', async () => {
            const largeData = 'a'.repeat(10.1 * 1024 * 1024);
            mockReq.body = {
                question: 'test',
                input: {
                    mimeType: 'audio/webm',
                    data: largeData
                }
            };

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(413);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Payload Too Large' });
        });
    });

    describe('Text Analysis', () => {
        it('should analyze text answer successfully', async () => {
            const mockResult = {
                transcript: 'I am a software engineer...',
                feedback: ['Good detail', 'Strong intro', 'Clear tone'],
                keyTerms: ['Software Engineering', 'Experience'],
                rating: 'Strong'
            };

            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify(mockResult)
            });

            await handler(mockReq, mockRes);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [expect.objectContaining({
                        text: expect.stringContaining('text answer')
                    })]
                }
            }));

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockResult);
        });
    });

    describe('Audio Analysis', () => {
        it('should analyze audio answer successfully', async () => {
            mockReq.body = {
                question: 'What is your biggest weakness?',
                input: {
                    mimeType: 'audio/webm',
                    data: 'base64data'
                }
            };

            const mockResult = {
                transcript: 'My biggest weakness is...',
                feedback: ['Honest', 'Action-oriented', 'Good pace'],
                deliveryStatus: 'Confident',
                deliveryTips: ['Breathe more', 'Smile'],
                keyTerms: ['Weakness', 'Growth'],
                rating: 'Good'
            };

            mockGenerateContent.mockResolvedValue({
                text: JSON.stringify(mockResult)
            });

            await handler(mockReq, mockRes);

            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: {
                    parts: [
                        expect.objectContaining({ text: expect.stringContaining('Transcribe the audio') }),
                        expect.objectContaining({
                            inlineData: {
                                mimeType: 'audio/webm',
                                data: 'base64data'
                            }
                        })
                    ]
                }
            }));

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockResult);
        });
    });

    describe('Error Handling', () => {
        it('should handle empty response from AI', async () => {
            mockGenerateContent.mockResolvedValue({ text: '' });

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Failed to analyze answer'
            }));
        });

        it('should handle AI model failure', async () => {
            mockGenerateContent.mockRejectedValue(new Error('AI Service Down'));

            await handler(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                details: 'AI Service Down'
            }));
        });
    });
});
