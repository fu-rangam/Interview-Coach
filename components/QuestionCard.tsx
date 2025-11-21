import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

interface QuestionCardProps {
  question: string;
  role: string;
  currentIndex: number;
  total: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, role, currentIndex, total }) => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset audio when question changes
  useEffect(() => {
    setAudioUrl('');
    setIsPlaying(false);
    setAudioError('');
    setIsLoadingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Fix: removeAttribute('src') prevents the browser from trying to load the current page as audio
      audioRef.current.removeAttribute('src');
    }

    // Prefetch audio after a short delay to avoid conflicts
    const timer = setTimeout(async () => {
      try {
        const url = await generateSpeech(question);
        if (url) {
          setAudioUrl(url);
          if (audioRef.current) {
            audioRef.current.src = url;
            // Preload the audio
            audioRef.current.load();
          }
        }
      } catch (error) {
        console.log('Prefetch failed, will load on demand');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [question]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const handlePlayVoice = async () => {
    try {
      setAudioError('');
      if (isPlaying) return;

      setIsLoadingAudio(true);

      let url = audioUrl;

      // If no URL yet (prefetch didn't finish or failed), fetch now
      if (!url) {
        url = await generateSpeech(question);
        if (!url) throw new Error("Failed to generate audio");
        setAudioUrl(url);
      }

      if (audioRef.current) {
        // Only set src if it's different to avoid reloading if already ready
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }

        // Set playback speed
        audioRef.current.playbackRate = 1.2;

        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Playback error:", e);
      setAudioError('Playback failed. Try again.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg shadow-indigo-100/50 border border-slate-100 mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md uppercase tracking-wider border border-indigo-100">
          {role}
        </span>
        <span className="text-slate-400 text-sm font-medium">Question {currentIndex + 1} of {total}</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 leading-snug mb-4">
        {question}
      </h2>
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={handlePlayVoice}
          aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
          className="px-4 py-2 text-sm font-medium rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 min-w-[120px] flex justify-center"
          disabled={isLoadingAudio || isPlaying}
        >
          {isLoadingAudio ? 'Loading...' : isPlaying ? 'Playing...' : 'Play Voice'}
        </button>
        <audio
          ref={audioRef}
          hidden
          onError={(e) => {
            console.error("Audio element error:", e);
            setAudioError("Audio format not supported");
            setIsLoadingAudio(false);
            setIsPlaying(false);
          }}
        />
        {audioError && (
          <span className="text-sm text-red-600 animate-pulse" role="status">{audioError}</span>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;