import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  try {
    // 1. Input Validation
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // In Node.js environments, Vercel automatically parses JSON into req.body
    const { text } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Server Error: GEMINI_API_KEY is missing");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 2. Call Gemini 2.5 Flash for Audio
    // We use Flash because it is generally faster/cheaper for this simple task
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: `Please read this sentence clearly and professionally: "${text}"` }]
      },
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede'
            }
          }
        }
      }
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part?.inlineData?.data) {
      console.error("Gemini API response missing audio data");
      return res.status(500).json({ error: 'Failed to generate audio from AI' });
    }

    // 3. Process Audio (Base64 -> Buffer -> WAV)
    const base64Audio = part.inlineData.data;
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Create WAV Header
    const wavHeader = createWavHeader(audioBuffer.length);
    
    // Combine Header + Audio
    const finalBuffer = Buffer.concat([wavHeader, audioBuffer]);

    // 4. Send Response
    return res.status(200).json({ 
      audioBase64: finalBuffer.toString('base64') 
    });

  } catch (error) {
    console.error("Server TTS Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// --- Helper: Create WAV Header (Node.js Buffer Version) ---
function createWavHeader(dataLength) {
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4); // File size - 8
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1)
  buffer.writeUInt32LE(24000, 24); // SampleRate (24kHz)
  buffer.writeUInt32LE(24000 * 2, 28); // ByteRate (SampleRate * BlockAlign)
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}