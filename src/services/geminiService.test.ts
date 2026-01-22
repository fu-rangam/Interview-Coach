import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateBlueprint,
  generateQuestionPlan,
  generateQuestions,
  analyzeAnswer,
  blobToBase64,
  generateSpeech,
} from './geminiService';
import { CompetencyBlueprint, QuestionPlan } from '../types';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}));

describe('geminiService', () => {
  let fetchMock: any;

  beforeEach(() => {
    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Stub browser globals if missing
    if (!global.atob) {
      vi.stubGlobal('atob', (str: string) => Buffer.from(str, 'base64').toString('binary'));
    }
    if (!global.Blob) {
      class MockBlob {
        parts: any[];
        type: string;
        constructor(parts: any[], options?: any) {
          this.parts = parts;
          this.type = options?.type || '';
        }
      }
      vi.stubGlobal('Blob', MockBlob);
    }

    // Ensure Mock TTS is disabled for tests
    vi.stubEnv('VITE_MOCK_TTS', 'false');

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Helper Tests ---
  describe('blobToBase64', () => {
    it('should convert blob to base64 string', async () => {
      const blob = new Blob(['test data'], { type: 'text/plain' });
      const result = await blobToBase64(blob);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  // --- API Tests ---

  describe('generateBlueprint', () => {
    it('should call /api/generate-blueprint and return data', async () => {
      // Mock strictly matching CompetencyBlueprint interface
      const mockBlueprint: CompetencyBlueprint = {
        role: { title: 'Dev', seniority: 'Mid' },
        readingLevel: { mode: 'Professional', maxSentenceWords: 20, avoidJargon: false },
        competencies: [],
        questionMix: { behavioral: 1, situational: 1, technical: 1 },
        scoringModel: {
          dimensions: [],
          ratingBands: {
            Developing: { min: 0, max: 2 },
            Good: { min: 3, max: 4 },
            Strong: { min: 5, max: 5 },
          },
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprint,
      });

      const result = await generateBlueprint('Dev', 'JD', 'Mid');

      expect(result).toEqual(mockBlueprint);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/generate-blueprint',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ role: 'Dev', jobDescription: 'JD', seniority: 'Mid' }),
        })
      );
    });

    it('should return null on error', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      const result = await generateBlueprint('Dev');
      expect(result).toBeNull();
    });
  });

  describe('generateQuestionPlan', () => {
    it('should call /api/generate-question-plan', async () => {
      const mockBlueprint = { role: { title: 'Dev' } } as any;
      const mockPlan: QuestionPlan = {
        role: 'Dev',
        questions: [],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      const result = await generateQuestionPlan(mockBlueprint);

      expect(result).toEqual(mockPlan);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/generate-question-plan',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ blueprint: mockBlueprint }),
        })
      );
    });
  });

  describe('generateQuestions', () => {
    it('should call /api/generate-questions with plan and blueprint', async () => {
      const mockQuestions = [{ id: '1', text: 'Q1' }];
      const mockPlan = { role: 'Dev', questions: [] } as any;
      const mockBlueprint = { role: { title: 'Dev' } } as any;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions,
      });

      const result = await generateQuestions('Dev', 'JD', mockPlan, mockBlueprint);

      expect(result).toEqual(mockQuestions);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/generate-questions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            role: 'Dev',
            jobDescription: 'JD',
            questionPlan: mockPlan,
            blueprint: mockBlueprint,
          }),
        })
      );
    });

    it('should fallback gracefully on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      const result = await generateQuestions('Dev');
      expect(result).toHaveLength(3); // Fallback length
      expect(result[0].text).toContain('Dev');
    });
  });

  describe('analyzeAnswer', () => {
    it('should call /api/analyze-answer with blueprint and questionId', async () => {
      const mockAnalysis = { rating: 'Strong' };
      const mockBlueprint = { role: { title: 'Dev' } } as any;
      const qId = '123';

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      });

      await analyzeAnswer('Question text', 'Answer text', mockBlueprint, qId);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/analyze-answer',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"blueprint":'),
        })
      );

      // Check body JSON parsing to verify deep fields
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.blueprint).toEqual(mockBlueprint);
      expect(callBody.questionId).toBe(qId);
      expect(callBody.input).toBe('Answer text');
    });
  });

  describe('generateSpeech', () => {
    it('should call /api/tts', async () => {
      const mockUrl = 'blob:test';
      global.URL.createObjectURL = vi.fn(() => mockUrl);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ audioBase64: 'MQ==' }), // "1" in base64
      });

      const result = await generateSpeech('Hello');
      expect(result).toBe(mockUrl);
      expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.anything());
    });
  });
});
