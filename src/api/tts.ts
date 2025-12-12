import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  try {
    // 1. Input Validation
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

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

    console.log(`[TTS] Starting generation for text: "${text.substring(0, 20)}..."`);

    // 2. Call Gemini 2.5 Flash for Audio
    const wrapped = `Instruction: Read the following interview question as a hiring manager addressing a candidate.\n${text}`;

    console.log("[TTS] Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: wrapped }]
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

    console.log("[TTS] Gemini API responded.");
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part?.inlineData?.data) {
      console.error("[TTS] Gemini API response missing audio data");
      return res.status(500).json({ error: 'Failed to generate audio from AI' });
    }

    const mimeType = part.inlineData.mimeType || 'unknown';
    console.log(`[TTS] Audio data received. MimeType: ${mimeType}`);

    const base64Audio = part.inlineData.data;
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    console.log(`[TTS] Received Audio Buffer Size: ${audioBuffer.length} bytes`);

    // Case A: Gemini returned MP3 (send as is)
    if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
      console.log("[TTS] Gemini returned MP3. Sending directly.");
      return res.status(200).json({
        audioBase64: base64Audio,
        mimeType: 'audio/mpeg'
      });
    }

    // Case B: Gemini returned Raw PCM (audio/L16) -> Wrap in WAV Header
    // We tried swapping bytes (BE->LE) and it didn't help.
    // We tried sending as is (LE) and it didn't help.
    // But we must fix the syntax error first.
    // Let's stick to the standard assumption: PCM is usually Little Endian on these APIs unless specified.
    if (mimeType.startsWith('audio/L16') || mimeType.startsWith('audio/pcm')) {
      console.log("[TTS] Gemini returned PCM. Wrapping in WAV header...");

      const wavHeader = createWavHeader(audioBuffer.length);
      const wavBuffer = Buffer.concat([wavHeader, audioBuffer]);

      console.log(`[TTS] Sending WAV. Total Size: ${wavBuffer.length} bytes`);
      return res.status(200).json({
        audioBase64: wavBuffer.toString('base64'),
        mimeType: 'audio/wav'
      });
    }

    // Case C: Unknown format -> Try sending as is (fallback)
    console.warn("[TTS] Unexpected mimeType:", mimeType);
    return res.status(200).json({
      audioBase64: base64Audio,
      mimeType: mimeType
    });

  } catch (error) {
    console.error("[TTS] Server Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

// --- Helper: Create WAV Header (Node.js Buffer Version) ---
// Specs for Gemini 2.5 Flash TTS: 24kHz, 1 Channel (Mono), 16-bit PCM
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
