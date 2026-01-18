import React, { memo } from 'react';
import { GlassCard } from '../ui/glass/GlassCard';
import GlassTips from '../ui/glass/GlassTips';
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

export const TipsAndTranscriptContent = memo(({
    className,
    sidebarTab,
    setSidebarTab,
    tips,
    transcript,
    playingUrl,
    toggleAudio
}: TipsAndTranscriptContentProps) => {
    return (
        <GlassCard className={cn("flex flex-col h-full bg-black/20 border-white/5 p-0 overflow-hidden", className)}>
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4 px-4 pt-4">
                <button
                    onClick={() => setSidebarTab('tips')}
                    className={cn(
                        "flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all text-center",
                        sidebarTab === 'tips'
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-gray-300"
                    )}
                >
                    Tips & Advice
                </button>
                <button
                    onClick={() => setSidebarTab('transcript')}
                    className={cn(
                        "flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all text-center",
                        sidebarTab === 'transcript'
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-gray-300"
                    )}
                >
                    Transcript
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {sidebarTab === 'tips' ? (
                    <GlassTips tips={tips} />
                ) : (
                    <div className="space-y-4 text-sm pt-2">
                        {transcript.length === 0 && (
                            <p className="text-gray-500 text-center italic mt-10">Transcript is empty...</p>
                        )}
                        {transcript.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex flex-col gap-1",
                                msg.sender === 'ai' ? "items-start" : "items-end"
                            )}>
                                {/* Bubble Label */}
                                {msg.label && (
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider mb-0.5",
                                        msg.sender === 'ai' ? "ml-1 text-gray-500" : "mr-1 text-cyan-500"
                                    )}>
                                        {msg.label}
                                    </span>
                                )}
                                {/* Bubble Content */}
                                <div className={cn(
                                    "p-3 rounded-lg border max-w-[90%]",
                                    msg.sender === 'ai'
                                        ? "bg-white/5 rounded-tl-none border-white/5 ml-4 text-gray-300"
                                        : "bg-cyan-900/20 rounded-tr-none border-cyan-500/20 mr-4 text-cyan-100"
                                )}>
                                    {msg.audioUrl ? (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            {/* 1. Transcript Text (Top) */}
                                            <span className="text-sm italic opacity-90 leading-relaxed pl-1 pt-1">
                                                {msg.text || "Audio recorded"}
                                            </span>

                                            {/* 2. Separator */}
                                            <div className="h-px bg-cyan-500/20 w-full my-1" />

                                            {/* 3. Player Controls (Bottom) */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleAudio(msg.audioUrl!)}
                                                    className={cn(
                                                        "flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0",
                                                        playingUrl === msg.audioUrl
                                                            ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/50"
                                                            : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300"
                                                    )}
                                                    title={playingUrl === msg.audioUrl ? "Pause" : "Play Recording"}
                                                >
                                                    {playingUrl === msg.audioUrl ? (
                                                        <Pause size={14} fill="currentColor" />
                                                    ) : (
                                                        <Play size={14} fill="currentColor" />
                                                    )}
                                                </button>
                                                <div className="text-xs text-cyan-400/70 font-mono">
                                                    {playingUrl === msg.audioUrl ? "Playing..." : "Listen"}
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
        </GlassCard>
    );
});
