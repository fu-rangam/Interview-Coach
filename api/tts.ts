import { GoogleGenAI } from '@google/genai';
import { validateUser } from './utils/auth.js';
import { logger } from '../src/utils/logger';

// --- In-Memory Rate Limiter (Container Scope) ---
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 5;
const requestLog = new Map<string, number[]>();

const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog.entries()) {
    const validTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, validTimestamps);
    }
  }
};

const checkRateLimit = (ip: string) => {
  cleanupRateLimits();
  const now = Date.now();
  const timestamps = requestLog.get(ip) || [];

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return true;
};

export default async function handler(req: any, res: any) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 0. Auth Validation (P0 Security)
    await validateUser(req);

    // 1. Rate Limiting (IP base fallback)
    // ...existing code...
    // Use x-forwarded-for if available (Vercel/Proxy), else socket address
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
      .split(',')[0]
      .trim();

    if (!checkRateLimit(ip)) {
      logger.warn(`[TTS] Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({ error: 'Too Many Requests. Please wait a moment.' });
    }

    // 1. Input Validation
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body' });
    }

    if (text.length > 800) {
      return res.status(400).json({ error: 'Text too long. Maximum 250 characters allowed.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Server Error: GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 2. Call Gemini 2.5 Flash for Audio
    const wrapped = `Instruction: Read the following interview question as a hiring manager addressing a candidate.\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: wrapped }],
      },
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Sulafat',
            },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part?.inlineData?.data) {
      logger.error('[TTS] Gemini API response missing audio data');
      return res.status(500).json({ error: 'Failed to generate audio from AI' });
    }

    const mimeType = part.inlineData.mimeType || 'unknown';
    const base64Audio = part.inlineData.data;
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Case A: Gemini returned MP3 (send as is)
    if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
      return res.status(200).json({
        audioBase64: base64Audio,
        mimeType: 'audio/mpeg',
      });
    }

    // Case B: Gemini returned Raw PCM (audio/L16) -> Wrap in WAV Header
    if (mimeType.startsWith('audio/L16') || mimeType.startsWith('audio/pcm')) {
      const wavHeader = createWavHeader(audioBuffer.length);
      const wavBuffer = Buffer.concat([wavHeader, audioBuffer]);

      return res.status(200).json({
        audioBase64: wavBuffer.toString('base64'),
        mimeType: 'audio/wav',
      });
    }

    // Case C: Unknown format -> Try sending as is (fallback)
    logger.warn('[TTS] Unexpected mimeType: ' + mimeType);
    return res.status(200).json({
      audioBase64: base64Audio,
      mimeType: mimeType,
    });
  } catch (error: any) {
    logger.error('[TTS] Server Error', error);
    if (error.message.includes('Authorization') || error.message.includes('Token')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// --- Helper: Create WAV Header (Node.js Buffer Version) ---
// Specs for Gemini 2.5 Flash TTS: 24kHz, 1 Channel (Mono), 16-bit PCM
function createWavHeader(dataLength: any) {
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4); // File size - 8
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1)
  buffer.writeUInt32LE(24000, 24); // SampleRate (24kHz)
  buffer.writeUInt32LE(24000 * 2, 28); // ByteRate (SampleRate * BlockAlign)
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}
