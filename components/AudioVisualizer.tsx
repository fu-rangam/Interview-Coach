import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!contextRef.current) {
      contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioContext = contextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // Draw rounded bars
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Violet color palette (approx 124, 58, 237 for violet-600)
        const r = 124;
        const g = 58;
        const b = 237; 

        ctx.fillStyle = `rgba(${r},${g},${b}, ${0.5 + (barHeight/200)})`;

        // Draw rounded rect
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 5);
        ctx.fill();

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (contextRef.current && contextRef.current.state !== 'closed') {
        contextRef.current.close();
        contextRef.current = null;
      }
    };
  }, [stream, isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-32 rounded-xl bg-violet-50/50"
    />
  );
};

export default AudioVisualizer;