// Serverless function for natural voice synthesis using Google Cloud Text-to-Speech
// Shifted from ElevenLabs to Google TTS per user request.
// Expects POST { text: string }
// Environment variables (configure in Vercel dashboard):
//  - GOOGLE_TTS_API_KEY  (a standard Google API key with Text-to-Speech enabled OR service account proxy)
// Optional overrides:
//  - GOOGLE_TTS_VOICE_NAME (e.g. 'en-US-Wavenet-D')
//  - GOOGLE_TTS_LANGUAGE_CODE (default 'en-US')
// Returns: { audioBase64: string }

export const config = { runtime: 'nodejs18.x' };

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }
    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'GOOGLE_TTS_API_KEY not configured' }));
      return;
    }

    let body = req.body;
    // If body not parsed (depending on runtime), attempt manual parse
    if (!body) {
      const raw = await new Promise<string>((resolve) => {
        let data = '';
        req.on('data', (chunk: any) => { data += chunk; });
        req.on('end', () => resolve(data));
      });
      try {
        body = JSON.parse(raw);
      } catch (_) {
        body = {};
      }
    }

    const rawText = body?.text;
    if (typeof rawText !== 'string') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'text must be a string' }));
      return;
    }
    const text: string = rawText.trim();
    if (!text) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing text' }));
      return;
    }

    // Optional overrides from request body
    const reqVoiceName = typeof body?.voiceName === 'string' ? body.voiceName : undefined;
    const reqLanguageCode = typeof body?.languageCode === 'string' ? body.languageCode : undefined;
    const reqSpeakingRate = body?.speakingRate !== undefined ? Number(body.speakingRate) : undefined;
    const reqPitch = body?.pitch !== undefined ? Number(body.pitch) : undefined;

    // Environment defaults
    const envVoiceName = process.env.GOOGLE_TTS_VOICE_NAME;
    const envLanguageCode = process.env.GOOGLE_TTS_LANGUAGE_CODE;
    const envSpeakingRate = process.env.GOOGLE_TTS_SPEAKING_RATE ? Number(process.env.GOOGLE_TTS_SPEAKING_RATE) : undefined;
    const envPitch = process.env.GOOGLE_TTS_PITCH ? Number(process.env.GOOGLE_TTS_PITCH) : undefined;

    const voiceName = reqVoiceName || envVoiceName || 'en-US-Wavenet-D';
    const languageCode = reqLanguageCode || envLanguageCode || 'en-US';

    const speakingRateRaw = reqSpeakingRate ?? envSpeakingRate ?? 1.0;
    const pitchRaw = reqPitch ?? envPitch ?? 0.0;

    // Clamp per Google TTS limits: speakingRate [0.25, 4.0], pitch [-20.0, 20.0]
    const speakingRate = Math.min(4.0, Math.max(0.25, Number.isFinite(speakingRateRaw) ? speakingRateRaw : 1.0));
    const pitch = Math.min(20.0, Math.max(-20.0, Number.isFinite(pitchRaw) ? pitchRaw : 0.0));

    const googleEndpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const payload = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate, pitch }
    };

    const ttsResponse = await fetch(googleEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      res.statusCode = ttsResponse.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Google TTS request failed', details: errorText }));
      return;
    }

    const json = await ttsResponse.json().catch(() => ({}));
    const audioBase64 = json.audioContent;
    if (!audioBase64) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No audioContent in response' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ audioBase64 }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal error', details: err?.message }));
  }
}
