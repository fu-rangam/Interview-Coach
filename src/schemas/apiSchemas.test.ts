import { describe, it, expect } from 'vitest';
import { InitSessionSchema, GenerateQuestionsSchema, AnalyzeAnswerSchema } from './apiSchemas';

describe('API Schemas Validation', () => {
  describe('InitSessionSchema', () => {
    it('should validate a correct payload', () => {
      const payload = { role: 'Software Engineer' };
      const result = InitSessionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail if role is missing', () => {
      const payload = { jobDescription: 'stuff' };
      const result = InitSessionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should validate optional intakeData', () => {
      const payload = {
        role: 'CEO',
        intakeData: {
          confidenceScore: 3,
          challengeLevel: 'realistic',
        },
      };
      const result = InitSessionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('GenerateQuestionsSchema', () => {
    it('should validate a correct payload', () => {
      const payload = { role: 'Nurse' };
      const result = GenerateQuestionsSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate with optional fields', () => {
      const payload = {
        role: 'Driver',
        questionPlan: { questions: [{ id: 'q1' }] },
        subsetIndices: [0],
      };
      const result = GenerateQuestionsSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('AnalyzeAnswerSchema', () => {
    it('should validate text input', () => {
      const payload = {
        question: 'Tell me about yourself',
        input: 'I am a developer.',
      };
      const result = AnalyzeAnswerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate audio input', () => {
      const payload = {
        question: 'Tell me about yourself',
        input: { data: 'base64...', mimeType: 'audio/webm' },
      };
      const result = AnalyzeAnswerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail if input is missing', () => {
      const payload = { question: 'Q' };
      const result = AnalyzeAnswerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail if input object is empty', () => {
      const payload = { question: 'Q', input: {} };
      const result = AnalyzeAnswerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
