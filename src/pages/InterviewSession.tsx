import React, { useState, useEffect, useCallback, useContext } from 'react';
import { SessionContext } from '../context/SessionContext';
import { Mic, MessageSquare, ChevronLeft, ChevronRight, CheckCircle2, List, Lightbulb, Play, ArrowRight, Volume2, RotateCcw } from 'lucide-react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { cn } from '../lib/utils';
import AudioVisualizer from '../components/AudioVisualizer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useTextAnswer } from '../hooks/useTextAnswer';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeAnswer, generateSpeech } from '../services/geminiService';
import { logAuditEvent } from '../services/auditLogger';
import { SubmissionPopover } from '../components/SubmissionPopover';
import { TipsAndTranscriptContent, TranscriptItem } from '../components/session/TipsAndTranscriptContent';
import { SessionLoader } from '../components/ui/glass/SessionLoader';
import { AnimatePresence, motion } from 'framer-motion';
import { MultiStepLoader } from '../components/ui/glass/MultiStepLoader';

export const InterviewSession: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sessionCtx = useContext(SessionContext);
    const isStarting = location.state?.isStarting;

    if (!sessionCtx) {
        throw new Error("InterviewSession must be used within a SessionProvider");
    }

    const { session, nextQuestion, goToQuestion, saveAnswer, loadTipsForQuestion, clearAnswer, audioUrls, cacheAudioUrl } = sessionCtx;
    const { questions, currentQuestionIndex, answers } = session;
    const currentQuestion = questions?.[currentQuestionIndex];
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
    const isAnswered = !!currentAnswer;

    // Local State
    const [mode, setMode] = useState<'voice' | 'text'>('voice');
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

    // Clear transcript on new session start (detected via unique ID change)
    useEffect(() => {
        setTranscript([]);
    }, [session.id]);

    // Route Guard: Redirect if no active session (allow if starting)
    useEffect(() => {
        // Always redirect if COMPLETED
        if (session?.status === 'COMPLETED') {
            navigate('/dashboard');
            return;
        }

        // If no questions, redirect unless we are in the "starting" phase
        if ((!session || !session.questions || session.questions.length === 0) && !isStarting) {
            navigate('/dashboard');
        }
    }, [session, navigate, isStarting]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [playbackAudio, setPlaybackAudio] = useState<HTMLAudioElement | null>(null);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const [showPopover, setShowPopover] = useState(false);

    // Sidebar State
    const [sidebarTab, setSidebarTab] = useState<'tips' | 'transcript'>('tips');

    // Mobile UI States
    const [showMobileTips, setShowMobileTips] = useState(false);
    const [showMobileQuestions, setShowMobileQuestions] = useState(false);
    const [showMicPermissionError, setShowMicPermissionError] = useState(false);

    // MultiStepLoader State
    const [showLoader, setShowLoader] = useState(false);
    const [loaderComplete, setLoaderComplete] = useState(false);
    const [analysisReady, setAnalysisReady] = useState(false);

    // Loader State
    const [isLoaderVisible, setIsLoaderVisible] = useState(true);

    const {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        mediaStream,
        permissionError: micPermissionError
    } = useAudioRecording();

    const {
        isListening,
        transcript: liveTranscript,
        startListening,
        stopListening,
        resetTranscript
    } = useSpeechRecognition();

    const {
        textAnswer,
        setTextAnswer,
        resetText,
        isSubmitting: isTextSubmitting
    } = useTextAnswer();

    const [questionAudioUrl, setQuestionAudioUrl] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState(false);

    // Playback logic
    const togglePlayback = async (url: string, isAutoPlay = false) => {
        if (!url) return;

        console.log(`[InterviewSession] togglePlayback called for: ${url} (Auto: ${isAutoPlay})`);

        if (playingUrl === url && playbackAudio && !isAutoPlay) {
            console.log("[InterviewSession] Pausing.");
            playbackAudio.pause();
            setPlayingUrl(null);
        } else {
            if (playbackAudio) playbackAudio.pause();

            const audio = new Audio(url);
            audio.onplay = () => console.log("[InterviewSession] Audio started.");
            audio.onended = () => {
                console.log("[InterviewSession] Audio finished.");
                setPlayingUrl(null);
            };
            audio.onerror = (e) => {
                console.error("[InterviewSession] Audio error:", e);
                setAudioError(true);
                setPlayingUrl(null);
            };

            setPlaybackAudio(audio);

            try {
                await audio.play();
                setPlayingUrl(url);
            } catch (error) {
                console.error("[InterviewSession] Playback failed (Autoplay blocked?):", error);
                // If autoplay fails, we ensure the UI shows the "Read Question" button (playingUrl = null)
                setPlayingUrl(null);

                // If it was autoplay that failed, we DON'T want to prevent future attempts or claim it was "played" 
                // if we want to force them to click? 
                // Actually, if autoplay fails, the user *must* click manually.
                // The 'autoPlayedQuestions' set was already updated in the caller. 
                // That's fine, we don't want to infinite loop try to autoplay.
            }
        }
    };

    const handleRetry = () => {
        if (currentQuestion) {
            // Log discarded answer attempt to transcript
            setTranscript(prev => [
                ...prev,
                {
                    sender: 'system',
                    text: 'Answer attempt discarded.',
                    type: 'info',
                    label: 'Discarded'
                }
            ]);
            // CRITICAL: Clear the answer from session context so popover doesn't reappear
            clearAnswer(currentQuestion.id);
        }
        resetTranscript();
        setShowPopover(false);
    };

    // Track which questions have already been auto-played to prevent re-playing on revisit
    const [autoPlayedQuestions, setAutoPlayedQuestions] = useState<Set<string>>(new Set());

    // Effect: Auto-play question audio
    useEffect(() => {
        let active = true;

        const fetchAndPlayAudio = async () => {
            if (!currentQuestion?.text || isAnswered) return;

            // Don't show "generating" if we have it cached (service returns promise immediately),
            // but we set it true briefly to ensure UI feedback if it *does* take time.
            setIsAudioLoading(true);
            setAudioError(false);

            try {
                // Determine if we should autoplay
                const shouldAutoPlay = !autoPlayedQuestions.has(currentQuestion.id);
                console.log(`[InterviewSession] Fetching audio for Q: ${currentQuestion.id}. Autoplay: ${shouldAutoPlay}`);

                const url = await generateSpeech(currentQuestion.text);

                if (active && url) {
                    console.log("[InterviewSession] Audio URL received:", url);
                    setQuestionAudioUrl(url);

                    if (shouldAutoPlay) {
                        // Mark as played immediately to prevent double-trigger
                        setAutoPlayedQuestions(prev => new Set(prev).add(currentQuestion.id));
                        // Play
                        togglePlayback(url, true);
                    }
                } else {
                    console.log("[InterviewSession] Audio generation returned null.");
                    setAudioError(true);
                }
            } catch (err) {
                console.error("[InterviewSession] Failed to generate speech", err);
                setAudioError(true);
            } finally {
                if (active) setIsAudioLoading(false);
            }
        };

        // Wait only for question ID
        if (currentQuestion?.id) {
            // Reset audio state for new question
            if (playbackAudio) {
                playbackAudio.pause();
                setPlayingUrl(null);
            }
            // CRITICAL: Don't nullify URL immediately if we might have a cache hit, 
            // but we need to reset to ensure we don't show old audio for new question.
            setQuestionAudioUrl(null);

            fetchAndPlayAudio();
        }

        return () => { active = false; };
    }, [currentQuestion?.id, isAnswered]); // Removed isLoaderVisible dependency

    // Effect to coordinate loader completion + analysis readiness
    useEffect(() => {
        if (showLoader && loaderComplete && analysisReady) {
            const timer = setTimeout(() => {
                setShowLoader(false);
                setLoaderComplete(false);
                setAnalysisReady(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [showLoader, loaderComplete, analysisReady]);

    useEffect(() => {
        if (micPermissionError) {
            setShowMicPermissionError(true);
        }
    }, [micPermissionError]);

    useEffect(() => {
        return () => {
            if (playbackAudio) playbackAudio.pause();
        };
    }, [playbackAudio]);

    useEffect(() => {
        if (playbackAudio && playingUrl === null) {
            playbackAudio.pause();
        }
    }, [playingUrl]);

    const handleStopRecording = async () => {
        stopListening();
        const recordedAudioBlob = await stopRecording();
        if (recordedAudioBlob && currentQuestion) {
            const audioUrl = URL.createObjectURL(recordedAudioBlob);
            const currentTranscript = liveTranscript || "(Audio Response)";

            setTranscript(prev => {
                // Calculate attempt number
                let attemptCount = 1;
                for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i].type === 'question') break;
                    if (prev[i].type === 'answer') attemptCount++;
                }

                return [
                    ...prev,
                    {
                        sender: 'user',
                        text: currentTranscript,
                        type: 'answer',
                        label: `Answer (Question ${session.currentQuestionIndex + 1}) - Attempt ${attemptCount}`,
                        audioUrl
                    }
                ];
            });

            setShowLoader(true);
            setLoaderComplete(false);
            setAnalysisReady(false);

            try {
                const analysis = await analyzeAnswer(
                    currentQuestion.text,
                    recordedAudioBlob,
                    session.blueprint,
                    currentQuestion.id
                );

                saveAnswer(currentQuestion.id, {
                    audioBlob: recordedAudioBlob,
                    text: analysis.transcript || currentTranscript,
                    analysis
                });

                logAuditEvent('ANSWER_RECORDED', { questionId: currentQuestion.id, size: recordedAudioBlob.size });
                setAnalysisReady(true);
            } catch (err) {
                console.error("Analysis failed", err);
                saveAnswer(currentQuestion.id, {
                    audioBlob: recordedAudioBlob,
                    text: currentTranscript,
                    analysis: null
                });
                setAnalysisReady(true);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            startRecording();
            startListening();
        }
    };

    const handleTextSubmit = async () => {
        if (!textAnswer.trim()) return;

        const validText = textAnswer;

        setTranscript(prev => {
            // Calculate attempt number
            let attemptCount = 1;
            for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].type === 'question') break;
                if (prev[i].type === 'answer') attemptCount++;
            }

            return [
                ...prev,
                {
                    sender: 'user',
                    text: validText,
                    type: 'answer',
                    label: `Answer (Question ${session.currentQuestionIndex + 1}) - Attempt ${attemptCount}`
                }
            ];
        });

        setShowLoader(true);
        setLoaderComplete(false);
        setAnalysisReady(false);

        try {
            const analysisResult = await analyzeAnswer(
                currentQuestion.text,
                validText,
                session.blueprint,
                currentQuestion.id
            );

            saveAnswer(currentQuestion.id, {
                text: validText,
                analysis: analysisResult
            });
            logAuditEvent('ANSWER_RECORDED', { questionId: currentQuestion.id, type: 'text', length: validText.length });
            setAnalysisReady(true);
        } catch (err) {
            saveAnswer(currentQuestion.id, {
                text: validText,
                analysis: null
            });
            setAnalysisReady(true);
        } finally {
            setIsAnalyzing(false);
            resetText();
        }

        setTextAnswer('');
    };

    const handleNext = () => {
        if (playbackAudio) {
            setPlayingUrl(null);
            playbackAudio.pause();
        }
        // Do NOT clear transcript to preserve history
        nextQuestion();
    };

    const handleFinish = async () => {
        await sessionCtx.finishSession();
        navigate('/review');
    };

    // Load Tips & Manage Transcript for new questions
    const { tips } = session.questions.find(q => q.id === currentQuestion?.id) || { tips: undefined };

    useEffect(() => {
        if (currentQuestion?.id) {
            loadTipsForQuestion(currentQuestion.id);

            // Add Question to Transcript if not already last item
            setTranscript(prev => {
                const lastItem = prev[prev.length - 1];
                if (lastItem?.text === currentQuestion.text && lastItem?.type === 'question') return prev;

                return [
                    ...prev,
                    {
                        sender: 'ai',
                        text: currentQuestion.text,
                        type: 'question',
                        label: `Question ${session.currentQuestionIndex + 1}`
                    }
                ];
            });
        }
    }, [currentQuestion?.id, loadTipsForQuestion, session.currentQuestionIndex]);

    const handlePrev = useCallback(() => {
        goToQuestion(session.currentQuestionIndex - 1);
    }, [session.currentQuestionIndex, goToQuestion]);

    const handleNextQuestion = useCallback(() => {
        goToQuestion(session.currentQuestionIndex + 1);
    }, [session.currentQuestionIndex, goToQuestion]);

    const isFirstQuestion = session.currentQuestionIndex === 0;
    const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;
    const allQuestionsAnswered = Object.keys(session.answers).length === session.questions.length;

    // Handle initial loading or empty state
    if (!currentQuestion) {
        return (
            <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
                {/* Force Loader if no question data yet */}
                <SessionLoader
                    isLoading={true}
                    onTransitionComplete={() => { }}
                />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
            {/* Session Loader Overlay */}
            <SessionLoader
                isLoading={false}
                onTransitionComplete={() => setIsLoaderVisible(false)}
            />

            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px] delay-1000 animate-pulse-slow" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
            </div>

            {/* Content Container */}
            {!isLoaderVisible && (
                <>
                    {/* Header */}
                    <header className="h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 relative z-20">

                        <div className="flex items-center gap-4">
                            {/* Desktop Interview Label */}
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-white">Interview Session</p>
                                <p className="text-xs text-cyan-400">{session.role || "Candidate"}</p>
                            </div>
                        </div>
                    </header>

                    {/* Main Layout */}
                    <main className="flex-1 flex overflow-hidden p-2 md:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto w-full relative z-10">

                        {/* Lei Column: Tips & Transcript (Hidden on Mobile) */}
                        <div className="hidden md:flex flex-col flex-[0_0_28%] min-w-[320px] shrink-0 gap-6">
                            <TipsAndTranscriptContent
                                className="flex-1 flex flex-col overflow-hidden bg-zinc-900/40 border-white/5 transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60 group"
                                transcript={transcript}
                                tips={tips}
                                playingUrl={playingUrl}
                                toggleAudio={togglePlayback}
                                sidebarTab={sidebarTab}
                                setSidebarTab={setSidebarTab}
                            />
                        </div>

                        {/* Mobile Overlay: Tips & Transcript (Enhanced Close Button) */}
                        <AnimatePresence>
                            {showMobileTips && (
                                <motion.div
                                    initial={{ opacity: 0, x: -100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="fixed inset-0 z-60 bg-zinc-950 md:hidden flex flex-col"
                                >
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 safe-area-top">
                                        <h3 className="font-semibold text-white">Tips & Transcript</h3>
                                        <button
                                            onClick={() => setShowMobileTips(false)}
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white z-50 touch-manipulation"
                                            aria-label="Close"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-hidden p-4">
                                        <TipsAndTranscriptContent
                                            transcript={transcript}
                                            tips={tips}
                                            playingUrl={playingUrl}
                                            toggleAudio={togglePlayback}
                                            sidebarTab={sidebarTab}
                                            setSidebarTab={setSidebarTab}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Center Column: Question & Interaction */}
                        <div className="flex-1 flex flex-col min-w-0">

                            {/* Mobile Header Controls */}
                            <div className="md:hidden flex items-center justify-between mb-4 z-40 relative px-2">
                                <GlassButton
                                    onClick={() => setShowMobileTips(true)}
                                    className="px-4 py-2 text-xs flex items-center gap-2 bg-black/20 hover:bg-black/40 border-white/5 rounded-full backdrop-blur-sm shadow-none"
                                >
                                    <Lightbulb size={14} className="text-amber-400" />
                                    <span className="text-gray-300">Tips & Transcript</span>
                                </GlassButton>

                                <GlassButton
                                    onClick={() => setShowMobileQuestions(true)}
                                    className="px-4 py-2 text-xs flex items-center gap-2 bg-black/20 hover:bg-black/40 border-white/5 rounded-full backdrop-blur-sm shadow-none"
                                >
                                    <List size={14} className="text-cyan-400" />
                                    <span className="text-gray-300">Questions</span>
                                </GlassButton>
                            </div>

                            {/* Center Content */}
                            <div className="flex-1 flex gap-4 xl:gap-6 min-h-0 relative">

                                {/* Main Interaction Area */}
                                <div className="relative flex flex-col h-full overflow-y-auto custom-scrollbar min-w-0" style={{ flex: '3 1 0%' }}>
                                    <div className="flex-1 flex flex-col items-center pt-0 sm:pt-4 lg:pt-8 px-0 lg:px-4 gap-2 md:gap-8 pb-20 md:pb-32">

                                        {/* Question Text */}
                                        <div className="text-center max-w-3xl animate-fade-in-up">
                                            <p className="text-xl md:text-3xl font-medium text-white mb-2 leading-relaxed font-display">
                                                {currentQuestion.text}
                                            </p>

                                            {/* Audio Controls (Improved with Loading State) */}
                                            <div className="flex justify-center mt-2 h-6">
                                                {isAudioLoading ? (
                                                    <span className="flex items-center gap-2 text-xs text-cyan-400/50 animate-pulse font-medium tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></span>
                                                        Generating Audio...
                                                    </span>
                                                ) : questionAudioUrl ? (
                                                    <button
                                                        onClick={() => togglePlayback(questionAudioUrl, false)}
                                                        className="flex items-center gap-2 text-xs text-cyan-400/80 hover:text-cyan-300 transition-colors uppercase font-medium tracking-wider"
                                                    >
                                                        {playingUrl === questionAudioUrl ? (
                                                            <>
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                                                </span>
                                                                Stop Reading
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Volume2 size={12} /> Read Question
                                                            </>
                                                        )}
                                                    </button>
                                                ) : null}
                                            </div>

                                            {/* Mock TTS Indicator */}
                                            {import.meta.env.VITE_MOCK_TTS === 'true' && (
                                                <div className="flex justify-center mt-2 animate-pulse">
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono tracking-wider uppercase">
                                                        Mock TTS Active
                                                    </span>
                                                </div>
                                            )}

                                            <p className="text-xs md:text-sm text-cyan-400 font-medium tracking-wide mt-2">
                                                Question {session.currentQuestionIndex + 1} of {session.questions.length}
                                            </p>
                                        </div>

                                        {/* Mode Toggle */}
                                        <div className="flex bg-zinc-900/50 rounded-full p-1.5 border border-white/10 shadow-inner">
                                            <button
                                                onClick={() => setMode('voice')}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                                                    mode === 'voice'
                                                        ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] border border-cyan-500/10"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                                )}
                                            >
                                                <Mic size={14} className="md:w-4 md:h-4" /> Voice
                                            </button>
                                            <button
                                                onClick={() => setMode('text')}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                                                    mode === 'text'
                                                        ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] border border-cyan-500/10"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                                )}
                                            >
                                                <MessageSquare size={14} className="md:w-4 md:h-4" /> Text
                                            </button>
                                        </div>

                                        {/* Input Area */}
                                        {!isAnswered && mode === 'voice' && (
                                            <div className="flex-1 w-full flex flex-col items-center justify-start gap-4 animate-fade-in min-h-[200px] md:min-h-[300px]">
                                                {/* Visualizer */}
                                                <div className="w-full h-32 md:h-40 flex flex-col items-center justify-center relative gap-4">
                                                    {isRecording ? (
                                                        <>
                                                            <div className="w-full h-full relative flex items-center justify-center">
                                                                <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
                                                            </div>
                                                            <div className="absolute top-full left-0 right-0 mt-4 text-center">
                                                                <p className="text-gray-300 text-sm md:text-lg font-medium animate-pulse px-4">
                                                                    "{liveTranscript || "Listening..."}"
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <span className="text-white/20 text-lg font-medium tracking-wide">Ready to Record</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mic Button */}
                                                <div className="flex flex-col items-center gap-4 z-50 relative mt-2">
                                                    <button
                                                        onClick={handleToggleRecording}
                                                        className={cn(
                                                            "group relative w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(6,182,212,0.2)]",
                                                            isRecording
                                                                ? "bg-red-500/10 text-red-500 border-2 border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.4)] scale-110"
                                                                : "bg-black/40 text-cyan-400 border-2 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_60px_rgba(6,182,212,0.4)] hover:scale-105"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute inset-0 rounded-full opacity-20 transition-all duration-300",
                                                            isRecording ? "bg-red-500 animate-pulse" : "bg-cyan-500 group-hover:opacity-30"
                                                        )} />
                                                        <Mic size={32} className={cn("relative z-10 md:w-10 md:h-10", isRecording && "animate-bounce")} />
                                                    </button>
                                                    {micPermissionError && (
                                                        <p className="text-red-400 text-xs mt-2 bg-red-900/20 px-2 py-1 rounded-md border border-red-500/20">
                                                            Microphone access denied. Please check your browser settings.
                                                        </p>
                                                    )}
                                                    <p className={cn("text-xs font-medium tracking-wider transition-colors uppercase", isRecording ? "text-red-400" : "text-gray-500")}>
                                                        {isRecording ? "Recording..." : "Click to Speak"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {!isAnswered && mode === 'text' && (
                                            <div className="flex-1 flex flex-col items-center justify-start gap-6 animate-fade-in w-full max-w-2xl">
                                                <div className="relative w-full group">
                                                    <div className="absolute -inset-0.5 bg-linear-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                                    <div className="relative bg-zinc-900 ring-1 ring-white/10 rounded-2xl p-4 md:p-6 shadow-xl leading-none flex items-top justify-start space-x-6">
                                                        <div className="space-y-4 w-full">
                                                            <textarea
                                                                autoFocus
                                                                className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-base md:text-lg min-h-[150px] leading-relaxed custom-scrollbar"
                                                                placeholder="Type your answer here..."
                                                                value={textAnswer}
                                                                onChange={(e) => setTextAnswer(e.target.value)}
                                                            />
                                                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                                                <span className="text-xs text-gray-500">{textAnswer.length} chars</span>
                                                                <GlassButton
                                                                    onClick={handleTextSubmit}
                                                                    disabled={!textAnswer.trim() || isTextSubmitting}
                                                                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
                                                                >
                                                                    Submit Answer <ArrowRight size={16} className="ml-2" />
                                                                </GlassButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Answered State */}
                                        {isAnswered && (
                                            <div className="flex-1 flex items-center justify-center flex-col gap-4 opacity-50 pointer-events-none grayscale">
                                                {mode === 'voice' ? (
                                                    <div className="w-24 h-24 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                                                        <CheckCircle2 size={32} className="text-white/20" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full max-w-lg h-32 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center">
                                                        <CheckCircle2 size={32} className="text-white/20" />
                                                    </div>
                                                )}
                                                <p className="text-white/30 text-sm">Reviewing answer...</p>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Question List (Unlocked) */}
                        <div className="hidden lg:flex flex-col flex-[0_0_28%] min-w-[320px] shrink-0 gap-6">
                            <GlassCard className="flex-1 flex flex-col overflow-hidden bg-zinc-900/40 border-white/5 p-4">
                                <h3 className="font-semibold text-gray-300 mb-4 px-2">Question List</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {session.questions.map((q, idx) => (
                                        <div
                                            key={q.id}
                                            onClick={() => goToQuestion(idx)}
                                            className={cn(
                                                "p-3 rounded-lg border text-sm transition-all cursor-pointer group",
                                                idx === session.currentQuestionIndex
                                                    ? "bg-cyan-500/10 border-cyan-500/30 text-white"
                                                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono text-xs opacity-50">Q{idx + 1}</span>
                                                {session.answers[q.id] && <CheckCircle2 size={12} className="text-emerald-500" />}
                                            </div>
                                            {/* Allow expanding truncated text */}
                                            <p className="line-clamp-2 group-hover:line-clamp-none transition-all duration-200">{q.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>

                        {/* Mobile Overlay: Questions (Enhanced Close Button & Unlocked & High Z-Index) */}
                        <AnimatePresence>
                            {showMobileQuestions && (
                                <motion.div
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 100 }}
                                    className="fixed inset-0 z-50 bg-zinc-950 md:hidden flex flex-col pt-safe-top"
                                    style={{ zIndex: 100 }}
                                >
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0 h-16">
                                        <button
                                            onClick={() => setShowMobileQuestions(false)}
                                            className="absolute left-4 top-3 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white z-50 touch-manipulation border border-white/10"
                                            aria-label="Close"
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                        <h3 className="font-semibold text-white ml-auto mr-auto">Questions</h3>
                                        <div className="w-10" /> {/* Spacer for centering */}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                        <div className="space-y-3 pb-20"> {/* Added pb-20 to ensure bottom is scrollable above footer */}
                                            {session.questions.map((q, idx) => (
                                                <div
                                                    key={q.id}
                                                    onClick={() => {
                                                        goToQuestion(idx);
                                                        setShowMobileQuestions(false);
                                                    }}
                                                    className={cn(
                                                        "p-4 rounded-xl border text-sm transition-all active:scale-95 group",
                                                        idx === session.currentQuestionIndex
                                                            ? "bg-cyan-500/10 border-cyan-500/30 text-white shadow-lg shadow-cyan-900/20"
                                                            : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5">Q{idx + 1}</span>
                                                        {session.answers[q.id] && <CheckCircle2 size={16} className="text-emerald-500" />}
                                                    </div>
                                                    <p className="line-clamp-3 leading-relaxed group-hover:line-clamp-none transition-all">{q.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>


                    </main>

                    {/* Footer Controls (Cleaned up, no dots) */}
                    <footer className="h-16 md:h-20 lg:h-24 border-t border-white/5 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 relative z-20 shrink-0">
                        <div className="flex items-center gap-2 md:gap-4">
                            <GlassButton
                                onClick={handlePrev}
                                disabled={isFirstQuestion}
                                variant="secondary"
                                className="h-10 w-10 md:w-auto md:px-6 rounded-full flex items-center justify-center p-0 md:p-4"
                                title="Previous Question"
                            >
                                <ChevronLeft size={20} className="md:mr-2" />
                                <span className="hidden md:inline">Previous</span>
                            </GlassButton>

                            <GlassButton
                                onClick={handleNextQuestion}
                                disabled={isLastQuestion}
                                variant="secondary"
                                className="h-10 w-10 md:w-auto md:px-6 rounded-full flex items-center justify-center p-0 md:p-4"
                                title="Next Question"
                            >
                                <span className="hidden md:inline">Next</span>
                                <ChevronRight size={20} className="md:ml-2" />
                            </GlassButton>
                        </div>

                        {/* Middle Spacer (Dots removed per user request) */}
                        <div className="hidden md:block flex-1" />

                        <div className="flex items-center gap-3">
                            <GlassButton
                                onClick={handleFinish}
                                className="px-4 md:px-8 bg-linear-to-r from-cyan-600 to-cyan-500 hover:to-cyan-400 text-white border-0 shadow-lg shadow-cyan-900/20"
                            >
                                <CheckCircle2 size={18} className="mr-2" />
                                <span className="hidden md:inline">Finish & Review</span>
                                <span className="md:hidden">Finish</span>
                            </GlassButton>
                        </div>
                    </footer>
                </>
            )}

            {/* Loaders & Overlays */}
            <MultiStepLoader
                loadingStates={
                    mode === 'voice'
                        ? [
                            { text: "Coach is analyzing your answer..." },
                            { text: "Generating feedback..." },
                            { text: "Noting your speaking delivery..." },
                            { text: "Finalizing review..." }
                        ]
                        : [
                            { text: "Coach is analyzing your answer..." },
                            { text: "Generating feedback..." },
                            { text: "Finalizing review..." }
                        ]
                }
                loading={showLoader}
                duration={mode === 'voice' ? 3000 : 4000}
                onComplete={() => setLoaderComplete(true)}
            />

            <SubmissionPopover
                isOpen={!!currentAnswer && !showLoader}
                onRetry={handleRetry}
                onFeedback={() => setShowPopover(true)}
                onNext={handleNext}
                isSessionComplete={allQuestionsAnswered}
                onFinish={handleFinish}
                question={currentQuestion}
                questionIndex={session.currentQuestionIndex}
                answer={currentQuestion ? answers[currentQuestion.id] ? {
                    text: answers[currentQuestion.id].text || "",
                    audioBlob: answers[currentQuestion.id].audioBlob,
                    analysis: answers[currentQuestion.id].analysis
                } : undefined : undefined}
                blueprint={session.blueprint}
            />
        </div>
    );
};
