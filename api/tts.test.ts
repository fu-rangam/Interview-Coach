import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tts';

// Mock GoogleGenAI
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function() {
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock response object
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Mock request object
    mockReq = {
      method: 'POST',
      body: { text: 'Hello world' },
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

    it('should reject requests with empty text', async () => {
      mockReq.body = { text: '' };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing "text" in request body' });
    });

    it('should reject requests when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
    });
  });

  describe('TTS Generation', () => {
    it('should generate audio successfully', async () => {
      const mockAudioData = Buffer.from('fake-pcm-audio-data').toString('base64');
      
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: mockAudioData,
              },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
          parts: [{ text: 'Please read this sentence clearly and professionally: "Hello world"' }],
        },
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede',
              },
            },
          },
        },
      });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          audioBase64: expect.any(String),
        })
      );
    });

    it('should return valid WAV format with header', async () => {
      const mockAudioData = Buffer.from('test-audio').toString('base64');
      
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: mockAudioData,
              },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      const call = mockRes.json.mock.calls[0][0];
      const audioBuffer = Buffer.from(call.audioBase64, 'base64');
      
      // Check WAV header signature
      expect(audioBuffer.toString('ascii', 0, 4)).toBe('RIFF');
      expect(audioBuffer.toString('ascii', 8, 12)).toBe('WAVE');
      expect(audioBuffer.toString('ascii', 12, 16)).toBe('fmt ');
      expect(audioBuffer.toString('ascii', 36, 40)).toBe('data');
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
      mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('API quota exceeded'),
        })
      );
    });

    it('should handle long text inputs', async () => {
      const longText = 'This is a very long question that simulates a real interview scenario. '.repeat(10);
      mockReq.body = { text: longText };

      const mockAudioData = Buffer.from('audio').toString('base64');
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: { data: mockAudioData },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: {
            parts: [{ text: expect.stringContaining(longText) }],
          },
        })
      );
    });
  });

  describe('WAV Header Generation', () => {
    it('should create proper 24kHz mono 16-bit PCM header', async () => {
      const mockAudioData = Buffer.from(new Array(1000).fill(0)).toString('base64');
      
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: { data: mockAudioData },
            }],
          },
        }],
      });

      await handler(mockReq, mockRes);

      const call = mockRes.json.mock.calls[0][0];
      const audioBuffer = Buffer.from(call.audioBase64, 'base64');
      
      // Verify WAV format parameters
      expect(audioBuffer.readUInt16LE(20)).toBe(1); // PCM format
      expect(audioBuffer.readUInt16LE(22)).toBe(1); // Mono
      expect(audioBuffer.readUInt32LE(24)).toBe(24000); // 24kHz sample rate
      expect(audioBuffer.readUInt16LE(34)).toBe(16); // 16-bit
    });
  });
});
