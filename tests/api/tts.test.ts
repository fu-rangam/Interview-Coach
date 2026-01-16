import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/tts';

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
}));

describe('TTS API Handler', () => {
  let mockReq: any;
  let mockRes: any;
  let testCount = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    testCount++;

    // Mock response object
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Mock request object - USE UNIQUE IP TO BYPASS RATE LIMITER
    mockReq = {
      method: 'POST',
      body: { text: 'Hello world' },
      headers: { 'x-forwarded-for': `127.0.0.${testCount}` },
      socket: { remoteAddress: `127.0.0.${testCount}` }
    };

    // Set environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('Input Validation', () => {
    it('should reject non-POST requests', async () => {
      mockReq.method = 'GET';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
    });

    it('should reject requests without text', async () => {
      mockReq.body = {};

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "text" in request body' });
    });

    it('should reject requests with long text', async () => {
      mockReq.body = { text: 'a'.repeat(201) };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Text too long. Maximum 200 characters allowed.' });
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

  describe('TTS Generation', () => {
    it('should generate audio successfully (PCM fallback to WAV)', async () => {
      const mockAudioData = Buffer.from('fake-pcm-audio-data').toString('base64');

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: mockAudioData,
                mimeType: 'audio/L16;rate=24000'
              },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const result = mockRes.json.mock.calls[0][0];
      expect(result.mimeType).toBe('audio/wav');
    });

    it('should return valid WAV format with header for PCM data', async () => {
      const mockAudioData = Buffer.from('test-audio-data-long-enough').toString('base64');

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: mockAudioData,
                mimeType: 'audio/pcm'
              },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const call = mockRes.json.mock.calls[0][0];
      const audioBuffer = Buffer.from(call.audioBase64, 'base64');

      expect(audioBuffer.toString('ascii', 0, 4)).toBe('RIFF');
      expect(audioBuffer.toString('ascii', 8, 12)).toBe('WAVE');
    });

    it('should handle MP3 data without wrapping', async () => {
      const mockAudioData = Buffer.from('fake-mp3').toString('base64');

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: mockAudioData,
                mimeType: 'audio/mp3'
              },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        audioBase64: mockAudioData,
        mimeType: 'audio/mpeg'
      });
    });

    it('should handle missing audio data gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{}],
          },
        }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to generate audio from AI' });
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Quota exceeded'));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Quota exceeded')
      }));
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when too many requests from same IP', async () => {
      const ip = '192.168.1.1';
      mockReq.headers['x-forwarded-for'] = ip;

      const mockResults = {
        candidates: [{
          content: { parts: [{ inlineData: { data: 'abc', mimeType: 'audio/mp3' } }] }
        }]
      };
      mockGenerateContent.mockResolvedValue(mockResults);

      // Send 5 requests (MAX_REQUESTS_PER_WINDOW)
      for (let i = 0; i < 5; i++) {
        await handler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenLastCalledWith(200);
      }

      // 6th request should fail
      await handler(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenLastCalledWith(429);
      expect(mockRes.json).toHaveBeenLastCalledWith({ error: expect.stringContaining('Too Many Requests') });
    });
  });

  describe('WAV Header Generation', () => {
    it('should create proper 24kHz mono 16-bit PCM header', async () => {
      const mockAudioData = Buffer.from(new Uint8Array(2000)).toString('base64');

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: { data: mockAudioData, mimeType: 'audio/L16' },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      const call = mockRes.json.mock.calls[0][0];
      const audioBuffer = Buffer.from(call.audioBase64, 'base64');

      expect(audioBuffer.readUInt16LE(20)).toBe(1); // PCM format
      expect(audioBuffer.readUInt16LE(22)).toBe(1); // Mono
      expect(audioBuffer.readUInt32LE(24)).toBe(24000); // 24kHz sample rate
    });
  });
});
