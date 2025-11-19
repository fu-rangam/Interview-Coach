import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Question, AnalysisResult } from '../types';

// Mock the environment variable before importing the service
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

// Create mock functions
const mockGenerateContent = vi.fn();

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function() {
    return {
      models: {
        generateContent: mockGenerateContent,
      },
    };
  }),
  Type: {
    ARRAY: 'array',
    OBJECT: 'object',
    STRING: 'string',
  },
}));

// Now import after mocking
const { generateQuestions, analyzeAnswer, blobToBase64 } = await import('./geminiService');

describe('geminiService', () => {
  describe('blobToBase64', () => {
    it('should convert blob to base64 string', async () => {
      const testData = 'test audio data';
      const blob = new Blob([testData], { type: 'audio/webm' });
      
      const result = await blobToBase64(blob);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different blob types', async () => {
      const blob = new Blob(['test'], { type: 'audio/mp3' });
      
      const result = await blobToBase64(blob);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should reject on FileReader error', async () => {
      const blob = new Blob(['test']);
      
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read failed') as any);
            }
          }, 0);
        }
        onerror: ((event: any) => void) | null = null;
        onloadend: (() => void) | null = null;
        result: string | null = null;
      } as any;

      await expect(blobToBase64(blob)).rejects.toThrow();
      
      global.FileReader = originalFileReader;
    });
  });

  describe('generateQuestions', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return 5 questions for a given role', async () => {
      const mockQuestions = [
        { id: '1', text: 'Tell me about yourself?' },
        { id: '2', text: 'What are your strengths?' },
        { id: '3', text: 'Describe a challenging project.' },
        { id: '4', text: 'Where do you see yourself in 5 years?' },
        { id: '5', text: 'Why should we hire you?' },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockQuestions),
      });

      const result = await generateQuestions('Software Engineer');

      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('Software Engineer'),
        })
      );
    });

    it('should request diverse question types in prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([
          { id: '1', text: 'Test question' },
        ]),
      });

      await generateQuestions('Data Scientist');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('behavioral, technical, situational'),
        })
      );
    });

    it('should return mock questions when API call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await generateQuestions('Product Manager');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text');
      expect(result[0].text).toContain('Product Manager');
    });

    it('should return mock questions when no text is returned', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      const result = await generateQuestions('Designer');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON response gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json',
      });

      const result = await generateQuestions('Marketing Manager');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include proper response schema configuration', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([{ id: '1', text: 'Test' }]),
      });

      await generateQuestions('Engineer');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
            responseSchema: expect.objectContaining({
              type: 'array',
            }),
          }),
        })
      );
    });
  });

  describe('analyzeAnswer', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should analyze audio and return structured feedback', async () => {
      const mockAnalysis = {
        transcript: 'I have 5 years of experience in software development...',
        feedback: [
          'Great use of specific examples',
          'Consider using the STAR method',
          'Good confident tone',
        ],
        keyTerms: ['Software Development', 'Leadership', 'Agile'],
        rating: 'Strong',
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const result = await analyzeAnswer('Tell me about your experience', audioBlob);

      expect(result.transcript).toBe(mockAnalysis.transcript);
      expect(result.feedback).toHaveLength(3);
      expect(result.keyTerms).toHaveLength(3);
      expect(result.rating).toBe('Strong');
    });

    it('should include audio data in the request', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          transcript: 'Test',
          feedback: ['Good'],
          keyTerms: ['Test'],
          rating: 'Good',
        }),
      });

      const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      await analyzeAnswer('What is your biggest strength?', audioBlob);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining('What is your biggest strength?'),
              }),
              expect.objectContaining({
                inlineData: expect.objectContaining({
                  mimeType: 'audio/webm',
                  data: expect.any(String),
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('should request specific analysis criteria in prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          transcript: 'Test',
          feedback: ['Test'],
          keyTerms: ['Test'],
          rating: 'Good',
        }),
      });

      const audioBlob = new Blob(['test'], { type: 'audio/webm' });
      await analyzeAnswer('Test question', audioBlob);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents.parts[0].text;
      
      expect(promptText).toContain('Transcribe the audio');
      expect(promptText).toContain('feedback');
      expect(promptText).toContain('key professional terms');
      expect(promptText).toContain('rating');
    });

    it('should return mock analysis when API call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const audioBlob = new Blob(['test'], { type: 'audio/webm' });
      const result = await analyzeAnswer('Test question', audioBlob);

      expect(result).toBeDefined();
      expect(result.transcript).toBeDefined();
      expect(result.feedback).toBeInstanceOf(Array);
      expect(result.keyTerms).toBeInstanceOf(Array);
      expect(result.rating).toBeDefined();
    });

    it('should handle different audio mime types', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          transcript: 'Test',
          feedback: ['Test'],
          keyTerms: ['Test'],
          rating: 'Good',
        }),
      });

      const audioBlob = new Blob(['test'], { type: 'audio/mp3' });
      await analyzeAnswer('Test', audioBlob);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: expect.objectContaining({
                  mimeType: 'audio/mp3',
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('should use default mime type when blob type is not specified', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          transcript: 'Test',
          feedback: ['Test'],
          keyTerms: ['Test'],
          rating: 'Good',
        }),
      });

      const audioBlob = new Blob(['test']);
      await analyzeAnswer('Test', audioBlob);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: expect.objectContaining({
                  mimeType: 'audio/webm',
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('should validate response schema includes all required fields', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          transcript: 'Test',
          feedback: ['Test'],
          keyTerms: ['Test'],
          rating: 'Good',
        }),
      });

      const audioBlob = new Blob(['test']);
      await analyzeAnswer('Test', audioBlob);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseSchema: expect.objectContaining({
              required: expect.arrayContaining([
                'transcript',
                'feedback',
                'keyTerms',
                'rating',
              ]),
            }),
          }),
        })
      );
    });
  });
});
