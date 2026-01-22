import { useState, useRef, useEffect } from 'react';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async (): Promise<void> => {
    try {
      setError(null);
      setAudioBlob(null);
      setDuration(0);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API not supported. Ensure you are using HTTPS or localhost.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);

      // Start Timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      let errorMessage = 'Microphone access failed.';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.name === 'NotAllowedError') errorMessage = 'Microphone permission denied.';
        if (err.name === 'NotFoundError') errorMessage = 'No microphone found.';
      }
      setError(errorMessage);
      // Don't throw here to avoid unhandled promise rejections in UI, rely on error state
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        // Determine if we should treat this as an error or just ignore
        return;
      }

      // Stop Timer
      if (timerRef.current) clearInterval(timerRef.current);

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob); // Expose to state

        // Stop all tracks
        mediaStream?.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        setIsRecording(false);

        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, [mediaStream]);

  return {
    isRecording,
    mediaStream,
    audioBlob,
    duration,
    error,
    startRecording,
    stopRecording,
  };
}
