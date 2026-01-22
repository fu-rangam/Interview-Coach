import React, { useState, useEffect, useCallback, useContext } from 'react';
import { SessionContext } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { Mic, MessageSquare, ChevronLeft, ChevronRight, CheckCircle2, List, Lightbulb, Play, ArrowRight, Volume2, RotateCcw, X, Bug, Activity } from 'lucide-react';
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
import { DebugInfoModal } from '../components/DebugInfoModal';
import { FeedbackModal } from '../components/FeedbackModal';
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
    const [showPopover, setShowPopover] = useState(false); // Used for internal Feedback Modal
    const [showAnswerPopover, setShowAnswerPopover] = useState(false); // Used for main Submission Popover visibility

    // Recording Confirmation State
    const [showRecordingPopover, setShowRecordingPopover] = useState(false);
    const [pendingRecording, setPendingRecording] = useState<Blob | null>(null);

    // Sidebar State
    const [sidebarTab, setSidebarTab] = useState<'tips' | 'transcript'>('tips');

    // Mobile UI States
    // Mobile UI States
    const [showMobileTips, setShowMobileTips] = useState(false);
    const [showMobileQuestions, setShowMobileQuestions] = useState(false);
    const [showDebugModal, setShowDebugModal] = useState(false);
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
        resetTranscript();
        setShowPopover(false);
        setShowAnswerPopover(false);
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
                // Do NOT reset analysisReady to allow subsequent views without re-analysis
                // setAnalysisReady(false); 
                setShowPopover(true);
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

    // Stop recording - just save blob and show popover for user confirmation
    const handleStopRecording = async () => {
        stopListening();
        const recordedAudioBlob = await stopRecording();
        if (recordedAudioBlob) {
            setPendingRecording(recordedAudioBlob);
            setShowRecordingPopover(true);
        }
    };

    // User confirms submission
    const handleSubmitRecording = async () => {
        if (!pendingRecording || !currentQuestion) return;

        setShowRecordingPopover(false);
        const audioUrl = URL.createObjectURL(pendingRecording);
        const currentTranscript = liveTranscript || "(Audio Response)";

        setTranscript(prev => {
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

        // 1. Set initial pending state
        setLoaderComplete(false);
        setAnalysisReady(false);
        setShowLoader(false);

        // 2. Save answer immediately (pending analysis)
        saveAnswer(currentQuestion.id, {
            audioBlob: pendingRecording,
            text: currentTranscript,
            analysis: null
        });

        // 3. Show Popover immediately
        setShowAnswerPopover(true);

        // 4. Start Background Analysis
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeAnswer(
                currentQuestion.text,
                pendingRecording,
                session.blueprint,
                currentQuestion.id,
                session.intakeData
            );

            // Update with completed analysis
            saveAnswer(currentQuestion.id, {
                audioBlob: pendingRecording,
                text: analysis.transcript || currentTranscript,
                analysis
            });

            logAuditEvent('ANSWER_RECORDED', { questionId: currentQuestion.id, size: pendingRecording.size });
            setAnalysisReady(true);
        } catch (err) {
            console.error("Analysis failed", err);
            // Even on error, we update so 'analysis' is not null
            saveAnswer(currentQuestion.id, {
                audioBlob: pendingRecording,
                text: currentTranscript,
                analysis: null
            });
            setAnalysisReady(true); // Allow loader to finish if active
        } finally {
            setIsAnalyzing(false);
            setPendingRecording(null);
        }
    };

    // User discards recording and wants to retry
    const handleRetryRecording = () => {
        setShowRecordingPopover(false);
        setPendingRecording(null);
        resetTranscript();
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            resetTranscript();
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

        // 1. Set initial pending state
        setLoaderComplete(false);
        setAnalysisReady(false);
        setShowLoader(false);

        // 2. Save answer immediately (pending)
        saveAnswer(currentQuestion.id, {
            text: validText,
            analysis: null
        });

        // 3. Show Popover immediately
        setShowAnswerPopover(true);

        // 4. Start Background Analysis
        setIsAnalyzing(true);
        try {
            const analysisResult = await analyzeAnswer(
                currentQuestion.text,
                validText,
                session.blueprint,
                currentQuestion.id,
                session.intakeData
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
        // Do NOT clear transcript to preserve history
        nextQuestion();
        // Reset popover visibility for next question (though next question typically starts with no answer)
        setShowAnswerPopover(false);
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
            // Transcript update for questions removed as per requirement
        }
    }, [currentQuestion?.id, loadTipsForQuestion]);

    const handlePrev = useCallback(() => {
        goToQuestion(session.currentQuestionIndex - 1);
    }, [session.currentQuestionIndex, goToQuestion]);

    const handleNextQuestion = useCallback(() => {
        goToQuestion(session.currentQuestionIndex + 1);
    }, [session.currentQuestionIndex, goToQuestion]);

    const isFirstQuestion = session.currentQuestionIndex === 0;
    const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;
    const allQuestionsAnswered = Object.keys(session.answers).length === session.questions.length;

    const hasSkippedQuestions = !allQuestionsAnswered && isLastQuestion;



    // Handle initial loading or empty state
    if (!currentQuestion) {
        // If loading finished but no questions, it's an error
        if (!sessionCtx.isLoading && !isStarting) {
            return (
                <div className="h-screen flex flex-col items-center justify-center text-white font-sans p-8">
                    <div className="text-red-500 mb-4">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Failed to Start Session</h2>
                    <p className="text-gray-400 text-center mb-6">We couldn't generate the interview questions. Please try again.</p>
                    <GlassButton onClick={() => navigate('/interview')}>
                        Back to Setup
                    </GlassButton>
                </div>
            );
        }

        return (
            <div className="h-dvh flex flex-col text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
                {/* Force Loader if no question data yet */}
                <SessionLoader
                    isLoading={true}
                    onTransitionComplete={() => { }}
                />
            </div>
        );
    }

    return (
        <div className="h-dvh flex flex-col text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
            {/* Session Loader Overlay */}
            <SessionLoader
                isLoading={false}
                onTransitionComplete={() => setIsLoaderVisible(false)}
            />

            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px] delay-1000 animate-pulse-slow" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
            </div>

            {/* Content Container */}
            {!isLoaderVisible && (
                <>
                    {/* Header */}
                    <header className="h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 relative z-20">
                        {/* Mobile: Tips Left */}
                        <div className="md:hidden">
                            <button
                                onClick={() => {
                                    if (showMobileTips) {
                                        setShowMobileTips(false);
                                    } else {
                                        setShowMobileTips(true);
                                        setShowMobileQuestions(false);
                                    }
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border",
                                    showMobileTips
                                        ? "bg-white/10 text-white border-white/10"
                                        : "bg-black/20 text-gray-400 hover:text-gray-200 border-transparent"
                                )}
                            >
                                {showMobileTips ? <X size={14} /> : <Lightbulb size={14} className="text-amber-400" />}
                                <span>Tips & Transcript</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile: Questions Right */}
                            <div className="md:hidden">
                                <button
                                    onClick={() => {
                                        if (showMobileQuestions) {
                                            setShowMobileQuestions(false);
                                        } else {
                                            setShowMobileQuestions(true);
                                            setShowMobileTips(false);
                                        }
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border",
                                        showMobileQuestions
                                            ? "bg-white/10 text-white border-white/10"
                                            : "bg-black/20 text-gray-400 hover:text-gray-200 border-transparent"
                                    )}
                                >
                                    {showMobileQuestions ? <X size={14} /> : <List size={14} className="text-cyan-400" />}
                                    <span>Questions</span>
                                </button>
                            </div>

                            {/* Desktop Interview Label */}
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-white">Interview Session</p>
                                <p className="text-xs text-cyan-400">{session.role || "Candidate"}</p>
                            </div>

                            <button
                                onClick={() => setShowDebugModal(true)}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-cyan-400 border border-white/5 transition-colors"
                                title="Debug Session Data"
                            >
                                <Bug size={16} />
                            </button>
                        </div>
                    </header>

                    {/* Main Layout */}
                    <main className="flex-1 grid grid-cols-1 md:grid-cols-[30%_40%_30%] overflow-hidden p-2 md:p-6 lg:p-8 gap-6 w-full relative z-10">

                        {/* Lei Column: Tips & Transcript (Hidden on Mobile) */}
                        <div className="hidden md:flex flex-col min-w-0 gap-6 overflow-y-auto custom-scrollbar">
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
                                    className="fixed inset-x-0 bottom-0 top-16 z-30 bg-app-dark md:hidden flex flex-col"
                                >
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 safe-area-top">
                                        <h3 className="font-semibold text-white">Tips & Transcript</h3>
                                        <button
                                            onClick={() => setShowMobileTips(false)}
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white hover:bg-white/20 transition-colors z-50 touch-manipulation"
                                            aria-label="Close"
                                        >
                                            <X size={24} />
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
                        <div className="flex flex-col min-w-0 overflow-y-auto custom-scrollbar">

                            {/* Mobile Header Controls - REMOVED (Moved to Header) */}


                            {/* Center Content */}
                            <div className="flex-1 flex gap-4 xl:gap-6 min-h-0 relative">

                                {/* Main Interaction Area */}
                                <div className="relative flex flex-col h-full overflow-y-auto custom-scrollbar min-w-0 border-b border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border-x border-x-white/5 bg-zinc-900/20 backdrop-blur-sm rounded-b-2xl" style={{ flex: '3 1 0%' }}>
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

                                        {/* Mode Toggle or Retry Button */}
                                        {isAnswered && !showAnswerPopover ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <button
                                                    onClick={handleRetry}
                                                    className="flex items-center gap-2 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] border border-cyan-500/10 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                                >
                                                    <RotateCcw size={14} className="md:w-4 md:h-4" /> Retry Your Answer
                                                </button>

                                                {answers[currentQuestion.id]?.analysis && (
                                                    <button
                                                        onClick={() => setShowPopover(true)}
                                                        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                                                    >
                                                        <Activity size={14} /> See Coach's Feedback
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
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
                                        )}

                                        {/* Input Area */}
                                        {(!isAnswered || (showAnswerPopover && currentAnswer)) && mode === 'voice' && (
                                            <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 animate-fade-in min-h-[200px] md:min-h-[300px]">
                                                {/* Visualizer */}
                                                <div className="w-full h-32 md:h-40 flex flex-col items-center justify-center relative gap-4">
                                                    {isRecording ? (
                                                        <div className="w-full h-full relative flex items-center justify-center">
                                                            <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
                                                        </div>
                                                    ) : showAnswerPopover && currentAnswer ? (
                                                        // INLINE Submission Popover (View Analysis)
                                                        <SubmissionPopover
                                                            isOpen={true} // Always open if rendered here
                                                            onRetry={handleRetry}
                                                            onFeedback={() => {
                                                                if (currentAnswer?.analysis) {
                                                                    setShowPopover(true);
                                                                } else {
                                                                    setShowLoader(true);
                                                                }
                                                                setShowAnswerPopover(false);
                                                            }}
                                                            onNext={() => setShowAnswerPopover(false)}
                                                            isSessionComplete={allQuestionsAnswered}
                                                            onFinish={handleFinish}
                                                            question={currentQuestion}
                                                            questionIndex={session.currentQuestionIndex}
                                                            answer={currentAnswer}
                                                            blueprint={session.blueprint}
                                                            hasSkippedQuestions={hasSkippedQuestions}
                                                            onClose={() => setShowAnswerPopover(false)}
                                                            inline={true} // New prop to indicate inline styling
                                                        />
                                                    ) : showRecordingPopover ? (
                                                        // Submit/Retry Popover

                                                        <div className="flex flex-col items-center justify-center gap-4 animate-fadeIn">
                                                            <span className="text-white text-lg font-medium">Recording Complete</span>
                                                            <div className="flex gap-3">
                                                                <button
                                                                    onClick={handleSubmitRecording}
                                                                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
                                                                >
                                                                    Submit Answer
                                                                </button>
                                                                <button
                                                                    onClick={handleRetryRecording}
                                                                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg border border-white/20 transition-colors"
                                                                >
                                                                    Retry
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <span className="text-white/20 text-lg font-medium tracking-wide">Ready to Record</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mic Button - hide when popover is showing */}
                                                {!showRecordingPopover && (
                                                    <div className="flex flex-col items-center gap-4 z-10 relative mt-2">
                                                        <button
                                                            onClick={handleToggleRecording}
                                                            aria-label="Toggle Recording"
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
                                                )}
                                            </div>
                                        )}

                                        {(!isAnswered || (showAnswerPopover && currentAnswer)) && mode === 'text' && (
                                            <div className="flex-1 flex flex-col items-center justify-start gap-6 animate-fade-in w-full max-w-2xl">
                                                {showAnswerPopover && currentAnswer ? (
                                                    // INLINE Submission Popover (Text Mode) - Rendered in place of input
                                                    <div className="w-full h-40 flex flex-col items-center justify-center">
                                                        <SubmissionPopover
                                                            isOpen={true}
                                                            onRetry={handleRetry}
                                                            onFeedback={() => {
                                                                if (currentAnswer?.analysis) {
                                                                    setShowPopover(true);
                                                                } else {
                                                                    setShowLoader(true);
                                                                }
                                                                setShowAnswerPopover(false);
                                                            }}
                                                            onNext={() => setShowAnswerPopover(false)}
                                                            isSessionComplete={allQuestionsAnswered}
                                                            onFinish={handleFinish}
                                                            question={currentQuestion}
                                                            questionIndex={session.currentQuestionIndex}
                                                            answer={currentAnswer}
                                                            blueprint={session.blueprint}
                                                            hasSkippedQuestions={hasSkippedQuestions}
                                                            onClose={() => setShowAnswerPopover(false)}
                                                            inline={true}
                                                        />
                                                    </div>
                                                ) : (
                                                    // ... Existing Text Input ...
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
                                                                        className="bg-cyan-500 hover:bg-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/20"
                                                                    >
                                                                        Submit Answer <ArrowRight size={16} className="ml-2 text-white" />
                                                                    </GlassButton>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}



                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Question List (Unlocked) */}
                        <div className="hidden lg:flex flex-col min-w-0 gap-6 overflow-y-auto custom-scrollbar">
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
                                    className="fixed inset-x-0 bottom-0 top-16 z-30 bg-app-dark md:hidden flex flex-col"
                                    style={{ zIndex: 30 }}
                                >
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0 h-16">
                                        <h3 className="font-semibold text-white">Questions</h3>
                                        <button
                                            onClick={() => setShowMobileQuestions(false)}
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 text-white hover:bg-white/20 transition-colors z-50 touch-manipulation border border-white/10"
                                            aria-label="Close"
                                        >
                                            <X size={24} />
                                        </button>
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

                    {/* Footer Controls */}
                    <footer className="fixed bottom-0 left-0 right-0 md:static h-16 md:h-20 lg:h-24 border-t border-white/5 bg-zinc-950/50 backdrop-blur-md grid grid-cols-1 md:grid-cols-[30%_40%_30%] px-2 md:px-8 z-20 gap-6">
                        {/* Middle Column Controls (Col 2) */}
                        <div className="md:col-start-2 flex items-center justify-between w-full px-2 md:px-0">
                            <div className="flex items-center gap-2 md:gap-4">
                                <GlassButton
                                    onClick={handlePrev}
                                    disabled={isFirstQuestion}
                                    variant="outline"
                                    className="h-10 w-10 md:w-auto md:px-6 rounded-full flex items-center justify-center p-0 md:p-4"
                                    title="Previous Question"
                                >
                                    <ChevronLeft size={20} className="md:mr-2" />
                                    <span className="hidden md:inline">Previous</span>
                                </GlassButton>

                                <GlassButton
                                    onClick={handleNextQuestion}
                                    disabled={isLastQuestion}
                                    variant="outline"
                                    className="h-10 w-10 md:w-auto md:px-6 rounded-full flex items-center justify-center p-0 md:p-4"
                                    title="Next Question"
                                >
                                    <span className="hidden md:inline">Next</span>
                                    <ChevronRight size={20} className="md:ml-2" />
                                </GlassButton>
                            </div>

                            <GlassButton
                                onClick={handleFinish}
                                variant="outline"
                                className="px-4 md:px-8 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            >
                                <CheckCircle2 size={18} className="mr-2 text-cyan-400 group-hover:text-cyan-300" />
                                <span className="hidden md:inline">Finish & Review</span>
                                <span className="md:hidden">Finish</span>
                            </GlassButton>
                        </div>
                    </footer>
                </>
            )}

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

            <DebugInfoModal
                isOpen={showDebugModal}
                onClose={() => setShowDebugModal(false)}
                session={session}
            />

            <FeedbackModal
                isOpen={showPopover}
                onClose={() => setShowPopover(false)}
                question={currentQuestion}
                questionIndex={session.currentQuestionIndex}
                answer={currentQuestion ? answers[currentQuestion.id] ? {
                    text: answers[currentQuestion.id].text || "",
                    audioBlob: answers[currentQuestion.id].audioBlob,
                    analysis: answers[currentQuestion.id].analysis
                } : { text: "", analysis: null } : { text: "", analysis: null }}
                blueprint={session.blueprint}
            />
        </div>
    );
};

