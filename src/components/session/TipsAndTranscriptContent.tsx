import React, { memo } from 'react';
import { TipsList } from './TipsList';
import { Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';
import { QuestionTips } from '../../types';

export interface TranscriptItem {
  sender: 'ai' | 'user' | 'system';
  text: string;
  type?: 'question' | 'answer' | 'info';
  label?: string;
  audioUrl?: string;
}

export interface TipsAndTranscriptContentProps {
  className?: string;
  sidebarTab: 'tips' | 'transcript';
  setSidebarTab: (tab: 'tips' | 'transcript') => void;
  tips?: QuestionTips;
  transcript: TranscriptItem[];
  playingUrl: string | null;
  toggleAudio: (url: string) => void;
}

export const TipsAndTranscriptContent = memo(
  ({
    className,
    sidebarTab,
    setSidebarTab,
    tips,
    transcript,
    playingUrl,
    toggleAudio,
  }: TipsAndTranscriptContentProps) => {
    return (
      <div
        className={cn(
          'flex flex-col h-full bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4 px-4 pt-4 bg-slate-50/50">
          <button
            onClick={() => setSidebarTab('tips')}
            className={cn(
              'flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all text-center border',
              sidebarTab === 'tips'
                ? 'bg-white text-rangam-blue border-slate-200 shadow-sm py-2.5 -translate-y-px'
                : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            Tips & Advice
          </button>
          <button
            onClick={() => setSidebarTab('transcript')}
            className={cn(
              'flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all text-center border',
              sidebarTab === 'transcript'
                ? 'bg-white text-rangam-blue border-slate-200 shadow-sm py-2.5 -translate-y-px'
                : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            Transcript
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {sidebarTab === 'tips' ? (
            <TipsList tips={tips} />
          ) : (
            <div className="space-y-4 text-sm pt-2">
              {transcript.length === 0 && (
                <p className="text-slate-400 text-center italic mt-10">Transcript is empty...</p>
              )}
              {transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex flex-col gap-1',
                    msg.sender === 'ai' ? 'items-start' : 'items-end'
                  )}
                >
                  {/* Bubble Label */}
                  {msg.label && (
                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold tracking-wider mb-0.5',
                        msg.sender === 'ai' ? 'ml-1 text-slate-400' : 'mr-1 text-rangam-blue'
                      )}
                    >
                      {msg.label}
                    </span>
                  )}
                  {/* Bubble Content */}
                  <div
                    className={cn(
                      'p-3 rounded-2xl border max-w-[90%]',
                      msg.sender === 'ai'
                        ? 'bg-slate-100 rounded-tl-none border-slate-200 ml-4 text-slate-700'
                        : 'bg-blue-50 rounded-tr-none border-blue-100 mr-4 text-slate-800'
                    )}
                  >
                    {msg.audioUrl ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {/* 1. Transcript Text (Top) */}
                        <span className="text-sm italic opacity-90 leading-relaxed pl-1 pt-1 text-slate-600">
                          {msg.text || 'Audio recorded'}
                        </span>

                        {/* 2. Separator */}
                        <div className="h-px bg-slate-200 w-full my-1" />

                        {/* 3. Player Controls (Bottom) */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleAudio(msg.audioUrl!)}
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0',
                              playingUrl === msg.audioUrl
                                ? 'bg-rangam-blue text-white shadow-lg shadow-blue-500/30'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                            )}
                            title={playingUrl === msg.audioUrl ? 'Pause' : 'Play Recording'}
                            aria-label={
                              playingUrl === msg.audioUrl ? 'Pause Recording' : 'Play Recording'
                            }
                          >
                            {playingUrl === msg.audioUrl ? (
                              <Pause size={14} fill="currentColor" />
                            ) : (
                              <Play size={14} fill="currentColor" />
                            )}
                          </button>
                          <div className="text-xs text-slate-500 font-mono">
                            {playingUrl === msg.audioUrl ? 'Playing...' : 'Listen'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
