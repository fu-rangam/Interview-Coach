import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, Loader2, Pause } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuestionCardProps {
  question: string;
  role: string;
  currentIndex: number;
  total: number;
  hideHeader?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, role, currentIndex, total, hideHeader }) => {
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
      audioRef.current.removeAttribute('src');
    }

    // Prefetch audio after a short delay
    const timer = setTimeout(async () => {
      try {
        const url = await generateSpeech(question);
        if (url) {
          setAudioUrl(url);
          if (audioRef.current) {
            audioRef.current.src = url;
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
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      setIsLoadingAudio(true);

      let url = audioUrl;

      if (!url) {
        url = await generateSpeech(question);
        if (!url) throw new Error("Failed to generate audio");
        setAudioUrl(url);
      }

      if (audioRef.current) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }
        audioRef.current.playbackRate = 1.1; // Slightly faster for natural flow
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Playback error:", e);
      setAudioError(typeof e === 'object' && e && 'message' in e ? (e as any).message : 'Playback failed.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <Card className="w-full bg-white shadow-xl shadow-blue-100/50 border-slate-100">
      <CardContent className="p-8">
        {!hideHeader && (
          <div className="flex items-center space-x-2 mb-6">
            <span className="px-3 py-1 bg-blue-50 text-[#376497] text-xs font-bold rounded-full uppercase tracking-wider border border-blue-100">
              {role}
            </span>
            <span className="text-slate-400 text-sm font-medium">Question {currentIndex + 1} of {total}</span>
          </div>
        )}

        <h2 className={cn(
          "text-3xl md:text-3xl font-display font-semibold text-slate-900 leading-tight mb-8",
          question.length > 100 && "text-2xl" // Scale down for very long questions
        )}>
          {question}
        </h2>

        <div className="flex items-center space-x-3">
          <Button
            onClick={handlePlayVoice}
            variant="outline"
            disabled={isLoadingAudio}
            className={cn(
              "min-w-[140px] gap-2 font-semibold transition-all duration-300",
              isPlaying
                ? "bg-blue-50 text-[#376497] border-blue-200 hover:bg-blue-100"
                : "text-slate-600 hover:text-[#376497] hover:border-blue-200"
            )}
          >
            {isLoadingAudio ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Listen</span>
              </>
            )}
          </Button>

          {audioError && (
            <span className="text-sm text-rose-500 font-medium animate-pulse">{audioError}</span>
          )}

          <audio
            ref={audioRef}
            hidden
            onError={() => {
              setAudioError("Audio unavailable");
              setIsLoadingAudio(false);
              setIsPlaying(false);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;