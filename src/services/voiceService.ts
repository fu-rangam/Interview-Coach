import { supabase } from './supabase';

export async function synthesizeQuestion(text: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const resp = await fetch('/api/tts', {
    method: 'POST',
    headers,
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
