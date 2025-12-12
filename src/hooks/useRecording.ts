import { useState, useRef } from 'react';

export function useRecording() {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startRecording = async (): Promise<void> => {
        try {
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
        } catch (err) {
            console.error("Error accessing microphone:", err);
            throw new Error("Microphone access required");
        }
    };

    const stopRecording = (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorderRef.current || !isRecording) {
                reject(new Error("Not recording"));
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });

                // Stop all tracks
                mediaStream?.getTracks().forEach(track => track.stop());
                setMediaStream(null);
                setIsRecording(false);

                resolve(audioBlob);
            };

            mediaRecorderRef.current.stop();
        });
    };

    return {
        isRecording,
        mediaStream,
        startRecording,
        stopRecording
    };
}
