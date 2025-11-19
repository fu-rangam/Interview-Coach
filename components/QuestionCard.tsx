import React, { useState, useRef, useEffect } from 'react';
import { synthesizeQuestion } from '../services/voiceService';

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
      // Toggle if already loaded
      if (audioRef.current && audioUrl) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
        return;
      }
      setIsLoadingAudio(true);
      const url = await synthesizeQuestion(question);
      setAudioUrl(url);
      setIsLoadingAudio(false);
      if (audioRef.current && url) {
        audioRef.current.src = url;
        try {
          await audioRef.current.play();
        } catch (err: any) {
          setAudioError(err?.message || 'Playback was blocked');
          setIsPlaying(false);
          return;
        }
        setIsPlaying(true);
      }
    } catch {
      setIsLoadingAudio(false);
      setAudioError('Narration failed. Check API logs and env.');
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
          className="px-4 py-2 text-sm font-medium rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          disabled={isLoadingAudio}
        >
          {isLoadingAudio ? 'Loading...' : isPlaying ? 'Pause Voice' : audioUrl ? 'Play Again' : 'Play Voice'}
        </button>
        <audio ref={audioRef} hidden />
        {audioError && (
          <span className="text-sm text-red-600" role="status">{audioError}</span>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;