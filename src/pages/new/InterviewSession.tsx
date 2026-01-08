import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../../components/ui/glass/GlassCard';
import { GlassButton } from '../../components/ui/glass/GlassButton';
import { Mic, MicOff, Video, PhoneOff, MessageSquare, ArrowRight, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSessionContext } from '../../hooks/useSessionContext';
import { useRecording } from '../../hooks/useRecording'; // Assuming this hook exists and works
import { logAuditEvent } from '../../services/auditLogger';
import { generateSpeech } from '../../services/geminiService';

export const InterviewSession: React.FC = () => {
    const navigate = useNavigate();

    const { session, nextQuestion, saveAnswer, finishSession } = useSessionContext();
    const { isRecording, startRecording, stopRecording, audioBlob, duration } = useRecording();

    // Local state for transcript simulation (or real if available via a hook)
    const [transcript, setTranscript] = useState<{ sender: 'ai' | 'user', text: string }[]>([]);

    // Audio Visualizer State
    const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

    // AI Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentQuestion = session.questions[session.currentQuestionIndex];

    // Track session start logging
    const hasLoggedStart = useRef(false);

    // Effect: Log Start & Speak Question
    useEffect(() => {
        if (!currentQuestion) return;

        // Log session start only once per component mount (session begin)
        if (!hasLoggedStart.current) {
            logAuditEvent('SESSION_START', { questionId: currentQuestion.id });
            hasLoggedStart.current = true;
        }

        // Add AI greeting/question to transcript
        setTranscript(prev => [...prev, { sender: 'ai', text: currentQuestion.text }]);

        // Speak Question (Auto-play logic)
        const playIntro = async () => {
            try {
                const url = await generateSpeech(currentQuestion.text);
                if (url && audioRef.current) {
                    audioRef.current.src = url;
                    audioRef.current.play().catch(() => console.log("Auto-play blocked"));
                }
            } catch (e) {
                console.error("TTS failed", e);
            }
        };
        playIntro();

    }, [currentQuestion]);

    // Effect: Visualizer Animation
    useEffect(() => {
        if (!isRecording && !audioRef.current?.paused) return;

        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setBars(prev => prev.map(() => Math.random() * 40 + 10));
            }, 100);
        } else {
            setBars(new Array(20).fill(10));
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Handle Answer Save logic when recording stops
    useEffect(() => {
        if (audioBlob && currentQuestion) {
            saveAnswer(currentQuestion.id, {
                audioBlob,
                text: "(Audio Response Recorded)",
                analysis: null
            });
            logAuditEvent('ANSWER_RECORDED', { questionId: currentQuestion.id, size: audioBlob.size });

            // Add simulation to transcript
            setTranscript(prev => [...prev, { sender: 'user', text: "Recording captured..." }]);
        }
    }, [audioBlob]);

    const handleNext = () => {
        nextQuestion();
    };

    const handleFinish = async () => {
        await finishSession();
        logAuditEvent('SESSION_COMPLETED', { totalQuestions: session.questions.length });
        navigate('/glass/review');
    };

    if (!currentQuestion) {
        return (
            <div className="flex h-screen items-center justify-center text-white">
                Loading Session...
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col p-4 md:p-6">
            <audio ref={audioRef} hidden />

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
                                <div className="absolute inset-0 flex items-center justify-center text-cyan-200/50 font-bold tracking-widest">
                                    AI COACH
                                </div>
                            </div>
                            {isRecording && (
                                <div className="absolute inset-[-10px] rounded-full border border-cyan-500/50 animate-ping" />
                            )}
                        </div>

                        <div className="mt-8 text-center max-w-lg px-4">
                            <p className="text-xl font-medium text-white mb-2 leading-relaxed">
                                {currentQuestion.text}
                            </p>
                            {isRecording ? (
                                <span className="text-sm text-cyan-400 uppercase tracking-widest animate-pulse">Listening... {duration}s</span>
                            ) : (
                                <span className="text-sm text-gray-500 uppercase tracking-widest">AI Idle</span>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Transcript / Chat Sidebar */}
                <GlassCard className="flex flex-col h-full bg-black/20">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <h3 className="font-bold flex items-center gap-2 text-white">
                            <MessageSquare size={18} />
                            Transcript
                        </h3>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">Live</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm">
                        {transcript.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "p-3 rounded-lg border",
                                msg.sender === 'ai'
                                    ? "bg-white/5 rounded-tl-none border-white/5 ml-4 self-start text-gray-300"
                                    : "bg-cyan-900/20 rounded-tr-none border-cyan-500/20 mr-4 self-end text-cyan-100"
                            )}>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Bottom Controls Bar */}
            <GlassCard className="h-24 px-8 flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 rounded-none fixed bottom-0 left-0 right-0 z-50 md:left-64 m-0 w-auto">
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">
                        Question {session.currentQuestionIndex + 1} / {session.questions.length}
                    </span>
                </div>

                <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                            isRecording
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        )}
                    >
                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    {/* Next Question Button only if recording is stopped and we have an answer */}
                    {!isRecording && audioBlob && (
                        <button
                            onClick={handleNext}
                            className="w-12 h-12 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 flex items-center justify-center text-cyan-400 border border-cyan-500/30 transition-all"
                            title="Next Question"
                        >
                            <ArrowRight size={20} />
                        </button>
                    )}
                </div>

                <div>
                    <GlassButton
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={handleFinish}
                    >
                        <Save size={18} className="mr-2" />
                        Finish & Review
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};
