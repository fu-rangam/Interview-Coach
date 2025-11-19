// Client-side helper to request natural voice narration from serverless TTS API
// Converts returned base64 audio to an object URL suitable for playback.

export async function synthesizeQuestion(text: string): Promise<string> {
  const resp = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!resp.ok) {
    const details = await safeReadText(resp);
    throw new Error(`TTS request failed: ${resp.status} ${resp.statusText} ${details ?? ''}`.trim());
  }
  const data = await resp.json().catch(() => ({}));
  const base64 = (data as any).audioBase64 as string | undefined;
  if (!base64) {
    throw new Error('TTS response missing audioBase64');
  }
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

async function safeReadText(resp: Response): Promise<string | undefined> {
  try {
    return await resp.text();
  } catch {
    return undefined;
  }
}
