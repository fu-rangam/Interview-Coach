import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { Mic, MicOff, Video, PhoneOff, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export const InterviewSession: React.FC = () => {
    const navigate = useNavigate();
    const [isRecording, setIsRecording] = useState(false);

    // Simulate audio visualizer
    const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

    useEffect(() => {
        if (!isRecording) return;
        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.random() * 40 + 10));
        }, 100);
        return () => clearInterval(interval);
    }, [isRecording]);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 min-h-0">

                {/* Visualizer Area (AI Avatar) */}
                <div className="lg:col-span-2 relative flex flex-col">
                    <GlassCard className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black/40 border-white/5">

                        {/* Audio Waves Background */}
                        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
                            {bars.map((h, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: isRecording ? h + '%' : '10%' }}
                                    className="w-4 bg-cyan-500 rounded-full transition-all duration-100"
                                />
                            ))}
                        </div>

                        {/* Central Avatar */}
                        <div className="relative z-10 w-48 h-48 rounded-full bg-linear-to-br from-cyan-900 to-purple-900 border-4 border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                            <div className="w-40 h-40 rounded-full bg-black/50 overflow-hidden relative">
                                {/* Placeholder for 3D Avatar (Spline/Three.js) */}
                                <div className="absolute inset-0 flex items-center justify-center text-cyan-200/50 font-bold tracking-widest">
                                    AI COACH
                                </div>
                            </div>

                            {/* Listening Indicator ring */}
                            {isRecording && (
                                <div className="absolute inset-[-10px] rounded-full border border-cyan-500/50 animate-ping" />
                            )}
                        </div>

                        <div className="mt-8 text-center max-w-lg">
                            <p className="text-xl font-medium text-white mb-2">Can you describe a challenging technical problem you solved recently?</p>
                            <span className="text-sm text-cyan-400 uppercase tracking-widest animate-pulse">Listening...</span>
                        </div>
                    </GlassCard>
                </div>

                {/* Transcript / Chat Sidebar */}
                <GlassCard className="flex flex-col h-full bg-black/20">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <MessageSquare size={18} />
                            Transcript
                        </h3>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">Live</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm">
                        <div className="bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5 ml-4">
                            <p className="text-gray-300">Welcome to the interview session. Let's start with a brief introduction.</p>
                        </div>
                        <div className="bg-cyan-900/20 p-3 rounded-lg rounded-tr-none border border-cyan-500/20 mr-4">
                            <p className="text-cyan-100">Hi, I'm a senior developer with 5 years of experience in React...</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5 ml-4">
                            <p className="text-gray-300">Great. Can you describe a challenging technical problem you solved recently?</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Bottom Controls Bar */}
            <GlassCard className="h-24 px-8 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 rounded-none fixed bottom-0 left-0 right-0 z-50 md:left-64 m-0 w-auto">
                <div className="flex items-center gap-4">
                    {/* Timer or Status could go here */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-xs font-mono">04:23</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                            isRecording
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        )}
                    >
                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/5">
                        <Video size={20} />
                    </button>
                </div>

                <div>
                    <GlassButton
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => navigate('/dashboard')}
                    >
                        <PhoneOff size={20} className="mr-2" />
                        End Call
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};
