import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { SessionContext } from '../context/SessionContext';
import {
  Mic,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  Lightbulb,
  ArrowRight,
  Volume2,
  RotateCcw,
  X,
  Bug,
  Activity,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import AudioVisualizer from '../components/AudioVisualizer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioRecording } from '../hooks/useAudioRecording';
import { useTextAnswer } from '../hooks/useTextAnswer';
import { useEngagementTracker } from '../hooks/useEngagementTracker';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeAnswer, generateSpeech } from '../services/geminiService';
import { logAuditEvent } from '../services/auditLogger';
import { SubmissionPopover } from '../components/SubmissionPopover';
import { DebugInfoModal } from '../components/DebugInfoModal';
import { FeedbackModal } from '../components/FeedbackModal';
import {
  TipsAndTranscriptContent,
  TranscriptItem,
} from '../components/session/TipsAndTranscriptContent';
import { SessionLoader } from '../components/ui/session-loader';
import { AnimatePresence, motion } from 'framer-motion';

import { MultiStepLoader } from '../components/ui/multi-step-loader';
import { RecordingConfirmationModal } from '../components/modals/RecordingConfirmationModal';
import { EngagementDebugOverlay } from '../components/debug/EngagementDebugOverlay';

import { AppBackground } from '../components/AppBackground';

export const InterviewSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionCtx = useContext(SessionContext);
  const isStarting = location.state?.isStarting;

  if (!sessionCtx) {
    throw new Error('InterviewSession must be used within a SessionProvider');
  }

  const { session, goToQuestion, saveAnswer, loadTipsForQuestion, clearAnswer } = sessionCtx;
  const { questions, currentQuestionIndex, answers } = session;
  const currentQuestion = questions?.[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isAnswered = !!currentAnswer;
  const { updateSession } = sessionCtx;

  // Engagement Tracker
  // (Moved below useAudioRecording to respect dependency order)

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
  const [showEngagementDebug, setShowEngagementDebug] = useState(false);

  // MultiStepLoader State
  const [showLoader, setShowLoader] = useState(false);
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);

  // Loader State
  const [isLoaderVisible, setIsLoaderVisible] = useState(true);

  const {
    isRecording,
    isInitializing,
    // audioBlob,
    startRecording,
    stopRecording,
    mediaStream,
    permissionError: micPermissionError,
  } = useAudioRecording();

  // Engagement Tracker (Moved here to access isRecording)
  const tracker = useEngagementTracker({
    isEnabled: session.status !== 'COMPLETED',
    isContinuousActive: isRecording,
    onUpdate: (seconds) => {
      if (session.id) {
        updateSession(session.id, {
          engagedTimeSeconds: (session.engagedTimeSeconds || 0) + seconds,
        });
      }
    },
  });
  const { trackEvent } = tracker;

  const {
    // isListening,
    transcript: liveTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    textAnswer,
    setTextAnswer,
    resetText,
    isSubmitting: isTextSubmitting,
  } = useTextAnswer(currentQuestion?.id, session.id);

  const [questionAudioUrl, setQuestionAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Persistent Audio Object to maintain user interaction blessing
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Audio Cache to prevent redundant API calls
  const audioCache = React.useRef<Record<string, string>>({});

  // Initialize Audio Instance once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onplay = () => console.log('[InterviewSession] Audio started.');
      audioRef.current.onended = () => {
        console.log('[InterviewSession] Audio finished.');
        setPlayingUrl(null);
      };
      audioRef.current.onerror = (e) => {
        console.error('[InterviewSession] Audio error:', e);
        setPlayingUrl(null);
      };
    }
  }, []);

  // Playback logic
  const togglePlayback = useCallback(
    (url: string, isAutoPlay = false) => {
      (async () => {
        if (!url || !audioRef.current) return;

        console.log(`[InterviewSession] togglePlayback called for: ${url} (Auto: ${isAutoPlay})`);

        if (playingUrl === url && !audioRef.current.paused && !isAutoPlay) {
          console.log('[InterviewSession] Pausing.');
          audioRef.current.pause();
          setPlayingUrl(null);
        } else {
          // If playing something else, pause it
          if (!audioRef.current.paused) audioRef.current.pause();

          // Set source
          audioRef.current.src = url;
          // Important: Reset specific handlers if they were overridden, but here we set them globally in useEffect.
          // However, we might want to ensure state sync.

          try {
            await audioRef.current.play();
            setPlayingUrl(url);
          } catch (error) {
            console.error('[InterviewSession] Playback failed (Autoplay blocked?):', error);
            setPlayingUrl(null);
          }
        }
      })();
    },
    [playingUrl]
  );

  // Helper to trigger silent audio (bless the audio element)
  const triggerSilentAudio = useCallback(() => {
    if (audioRef.current) {
      // Use static file to avoid CSP data: URI violation
      // Ensure file exists in public/silent.mp3
      audioRef.current.src = '/silent.mp3';
      audioRef.current.volume = 0.1;
      audioRef.current.play().catch(() => console.warn('Silent trigger failed'));
    }
  }, []);

  // Strict Privacy: Track and Revoke all Object URLs
  const activeObjectUrls = React.useRef<Set<string>>(new Set());
  const trackUrl = useCallback((url: string) => {
    activeObjectUrls.current.add(url);
    return url;
  }, []);

  // Cleanup all audio data on unmount
  useEffect(() => {
    const urls = activeObjectUrls.current;

    return () => {
      console.log('[InterviewSession] Cleaning up audio data...');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      urls.clear();
      // Also clear cache references
      audioCache.current = {};
    };
  }, []);

  const handleRetry = () => {
    triggerSilentAudio(); // Bless audio on retry
    if (currentQuestion) {
      // Log discarded answer attempt to transcript
      setTranscript((prev) => [
        ...prev,
        {
          sender: 'system',
          text: 'Answer attempt discarded.',
          type: 'info',
          label: 'Discarded',
        },
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

      // SILENT BRIDGE: Play silence immediately to capture interaction window
      // This helps unlock audio context while we wait for the slow fetch
      if (audioRef.current) {
        try {
          // Use static file
          const shouldAutoPlay = !autoPlayedQuestions.has(currentQuestion.id);
          if (shouldAutoPlay) {
            audioRef.current.src = '/silent.mp3';
            audioRef.current.volume = 0.1; // Low volume just in case
            await audioRef.current.play().catch(() => console.warn('Silent bridge failed'));
          }
        } catch {
          // Ignore errors here
        }
      }

      try {
        const shouldAutoPlay = !autoPlayedQuestions.has(currentQuestion.id);
        console.log(
          `[InterviewSession] Fetching audio for Q: ${currentQuestion.id}. Autoplay: ${shouldAutoPlay}`
        );

        // CHECK CACHE FIRST
        let url: string | null = null;
        if (audioCache.current[currentQuestion.id]) {
          console.log(`[InterviewSession] CACHE HIT for Q: ${currentQuestion.id}`);
          url = audioCache.current[currentQuestion.id];
        } else {
          console.log(`[InterviewSession] Cache MISS for Q: ${currentQuestion.id}, fetching...`);
          url = await generateSpeech(currentQuestion.text);
          if (url) {
            const trackedUrl = trackUrl(url);
            audioCache.current[currentQuestion.id] = trackedUrl;
            url = trackedUrl;
          }
        }

        if (active && url) {
          console.log('[InterviewSession] Audio URL received:', url);
          setQuestionAudioUrl(url);

          if (shouldAutoPlay) {
            // Mark as played immediately to prevent double-trigger
            setAutoPlayedQuestions((prev) => new Set(prev).add(currentQuestion.id));

            if (audioRef.current) {
              // Restore volume
              audioRef.current.volume = 1.0;
              // Swap source and play
              togglePlayback(url, true);
            }
          }
        } else {
          console.log('[InterviewSession] Audio generation returned null.');
        }
      } catch (err) {
        console.error('[InterviewSession] Failed to generate speech', err);
      } finally {
        if (active) setIsAudioLoading(false);
      }
    };

    // Wait only for question ID
    if (currentQuestion?.id) {
      setIsAudioLoading(false); // Reset
      // Reset logic is handled by togglePlayback(null) or similar if needed,
      // but here we just want to sure we don't block.

      // CRITICAL: Don't nullify URL immediately if we might have a cache hit,
      // but we need to reset to ensure we don't show old audio for new question.
      setQuestionAudioUrl(null);

      fetchAndPlayAudio();
    }

    return () => {
      active = false;
      // Don't pause on cleanup of effect, only on unmount (handled by separate effect)
    };
  }, [
    autoPlayedQuestions,
    currentQuestion?.id,
    currentQuestion?.text,
    isAnswered,
    togglePlayback,
    trackUrl,
  ]); // Removed isLoaderVisible dependency

  // Effect to coordinate loader completion + analysis readiness
  useEffect(() => {
    if (showLoader && loaderComplete && analysisReady) {
      const timer = setTimeout(() => {
        setShowLoader(false);
        setLoaderComplete(false);
        // Do NOT reset analysisReady to allow subsequent views without re-analysis
        setShowPopover(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showLoader, loaderComplete, analysisReady]);

  useEffect(() => {
    return () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, []); // Empty dependency array, ref is stable

  useEffect(() => {
    if (audioRef.current && playingUrl === null && !audioRef.current.paused) {
      audioRef.current.pause();
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
    trackEvent('tier3', 'Recording Submitted'); // High value event
    if (!pendingRecording || !currentQuestion) return;

    setShowRecordingPopover(false);
    const audioUrl = trackUrl(URL.createObjectURL(pendingRecording));
    const currentTranscript = liveTranscript || '(Audio Response)';

    setTranscript((prev) => {
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
          audioUrl,
        },
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
      analysis: null,
    });

    // 3. Show Popover immediately
    setShowAnswerPopover(true);

    // 4. Start Background Analysis

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
        analysis,
      });

      logAuditEvent('ANSWER_RECORDED', {
        questionId: currentQuestion.id,
        size: pendingRecording.size,
      });
      setAnalysisReady(true);
    } catch (err) {
      console.error('Analysis failed', err);
      // Even on error, we update so 'analysis' is not null
      saveAnswer(currentQuestion.id, {
        audioBlob: pendingRecording,
        text: currentTranscript,
        analysis: null,
      });
      setAnalysisReady(true); // Allow loader to finish if active
    } finally {
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
      trackEvent('tier3', 'Recording Started'); // Start of high value activity
    }
  };

  const safeTrack = (event: 'tier2' | 'tier3', type?: string) => {
    try {
      trackEvent(event, type);
    } catch (e) {
      console.warn('Tracking failed', e);
    }
  };

  const handleTextSubmit = async () => {
    safeTrack('tier3', 'Text Submitted'); // High value event

    if (!textAnswer.trim()) {
      return;
    }

    const validText = textAnswer;
    // ... rest of function ...

    setTranscript((prev) => {
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
          label: `Answer (Question ${session.currentQuestionIndex + 1}) - Attempt ${attemptCount}`,
        },
      ];
    });

    // 1. Set initial pending state
    setLoaderComplete(false);
    setAnalysisReady(false);
    setShowLoader(false);

    // 2. Save answer immediately (pending)
    saveAnswer(currentQuestion.id, {
      text: validText,
      analysis: null,
    });

    // 3. Show Popover immediately
    setShowAnswerPopover(true);

    // 4. Start Background Analysis

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
        analysis: analysisResult,
      });
      logAuditEvent('ANSWER_RECORDED', {
        questionId: currentQuestion.id,
        type: 'text',
        length: validText.length,
      });
      setAnalysisReady(true);
    } catch (err) {
      console.error('Analysis failed', err); // Used err here
      saveAnswer(currentQuestion.id, {
        text: validText,
        analysis: null,
      });
      setAnalysisReady(true);
    } finally {
      resetText();
    }

    setTextAnswer('');
  };

  const handleFinish = async () => {
    await sessionCtx.finishSession();
    navigate('/review');
  };

  // Load Tips & Manage Transcript for new questions
  const { tips } = session.questions.find((q) => q.id === currentQuestion?.id) || {
    tips: undefined,
  };

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
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Failed to Start Session</h2>
          <p className="text-gray-400 text-center mb-6">
            We couldn't generate the interview questions. Please try again.
          </p>
          <Button onClick={() => navigate('/interview')}>Back to Setup</Button>
        </div>
      );
    }

    return (
      <div className="h-dvh flex flex-col text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
        {/* Force Loader if no question data yet */}
        <SessionLoader isLoading={true} onTransitionComplete={() => {}} />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col text-white overflow-hidden relative font-sans selection:bg-cyan-500/30">
      {/* Session Loader Overlay */}
      <SessionLoader isLoading={false} onTransitionComplete={() => setIsLoaderVisible(false)} />

      {/* Background Atmosphere - Light Mode */}
      <AppBackground />

      {/* Content Container */}
      {!isLoaderVisible && (
        <>
          {/* Header */}
          <header className="h-16 bg-transparent flex items-center justify-between px-4 md:px-8 relative z-20 pointer-events-none">
            {/* Mobile: Tips Left */}
            <div className="md:hidden pointer-events-auto">
              <button
                onClick={() => {
                  if (showMobileTips) {
                    setShowMobileTips(false);
                  } else {
                    setShowMobileTips(true);
                    setShowMobileQuestions(false);
                  }
                }}
                aria-label="Toggle tips"
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border',
                  showMobileTips
                    ? 'bg-rangam-navy text-white border-rangam-navy'
                    : 'bg-slate-100 text-slate-500 hover:text-slate-900 border-transparent'
                )}
              >
                {showMobileTips ? (
                  <X size={14} />
                ) : (
                  <Lightbulb size={14} className="text-amber-500" />
                )}
                <span>Tips & Transcript</span>
              </button>
            </div>

            <div className="flex items-center gap-4 pointer-events-auto">
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
                  aria-label="Toggle questions list"
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border',
                    showMobileQuestions
                      ? 'bg-rangam-navy text-white border-rangam-navy'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-900 border-transparent'
                  )}
                >
                  {showMobileQuestions ? (
                    <X size={14} />
                  ) : (
                    <List size={14} className="text-rangam-blue" />
                  )}
                  <span>Questions</span>
                </button>
              </div>

              {/* Desktop Interview Label */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-rangam-navy">Interview Session</p>
                <p className="text-xs text-rangam-blue">{session.role || 'Candidate'}</p>
              </div>

              <button
                onClick={() => setShowDebugModal(true)}
                className="p-2 rounded-full bg-transparent hover:bg-slate-200 text-slate-400 hover:text-rangam-blue border border-transparent transition-colors"
                title="Debug Session Data"
                aria-label="Open debug menu"
              >
                <Bug size={16} />
              </button>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 grid grid-cols-1 md:grid-cols-[3fr_4fr_3fr] overflow-hidden p-2 md:p-6 lg:p-8 gap-6 w-full relative z-10 pb-24 md:pb-6">
            {/* Left Column: Tips & Transcript (Hidden on Mobile) */}
            <div
              className="hidden md:flex flex-col min-w-0 gap-6 overflow-y-auto custom-scrollbar"
              onClick={() => trackEvent('tier2', 'Sidebar Interaction')}
            >
              <TipsAndTranscriptContent
                className="flex-1 flex flex-col overflow-hidden transition-all duration-300 group"
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
                  className="fixed inset-x-0 bottom-0 top-16 z-30 bg-white md:hidden flex flex-col"
                >
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-10 safe-area-top">
                    <h3 className="font-semibold text-slate-800">Tips & Transcript</h3>
                    <button
                      onClick={() => setShowMobileTips(false)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 text-slate-600 hover:bg-slate-200 transition-colors z-50 touch-manipulation"
                      aria-label="Close"
                    >
                      <X size={20} />
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
              <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
                {/* TOP CARD: Question Display (2:1 Ratio) */}
                <div
                  className="relative flex flex-col overflow-hidden min-w-0 border border-slate-200 border-t-white/50 border-b-[6px] border-b-slate-400 bg-slate-50/30 rounded-2xl transition-all shadow-sm"
                  style={{ flex: '2 1 0%' }}
                  onScroll={() => trackEvent('tier2', 'Question Scroll')}
                  onClick={() => trackEvent('tier2', 'Question Click')}
                >
                  {/* Top Card Header: Audio Controls */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/50 bg-transparent min-h-[40px]">
                    {/* Question Label */}
                    <span className="text-sm font-bold text-rangam-navy uppercase tracking-wider">
                      Question {currentQuestionIndex + 1}
                    </span>
                    {/* Audio Controls */}
                    <div className="flex items-center gap-3">
                      {isAudioLoading ? (
                        <span className="flex items-center gap-2 text-xs text-rangam-blue/50 animate-pulse font-medium tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rangam-blue/50"></span>
                          Generating Audio...
                        </span>
                      ) : questionAudioUrl ? (
                        <button
                          onClick={() => togglePlayback(questionAudioUrl, false)}
                          className="flex items-center gap-2 text-xs text-rangam-blue hover:text-rangam-orange transition-colors uppercase font-medium tracking-wider"
                        >
                          {playingUrl === questionAudioUrl ? (
                            <>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rangam-orange opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rangam-orange"></span>
                              </span>
                              Stop
                            </>
                          ) : (
                            <>
                              <Volume2 size={14} /> Read Question
                            </>
                          )}
                        </button>
                      ) : null}

                      {/* Mock Label (Inline) */}
                      {import.meta.env.VITE_MOCK_TTS === 'true' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-mono tracking-wider uppercase">
                          Mock TTS
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar p-6 md:p-10 text-center animate-fade-in-up">
                    <p className="text-xl md:text-3xl font-medium text-rangam-navy leading-relaxed font-display">
                      {currentQuestion.text}
                    </p>
                  </div>
                </div>

                {/* BOTTOM CARD: Input & Controls (1:1 Ratio remainder) */}
                <div
                  className="relative flex flex-col min-w-0 border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                  style={{ flex: '1 1 0%' }}
                >
                  {/* Card Header: Mode Toggle*/}
                  <div className="flex items-center justify-center px-4 py-3 bg-transparent">
                    {/* Mode Toggle (Only show if not answered) */}
                    {!isAnswered && (
                      <div className="flex bg-slate-200/60 p-1 rounded-full border border-slate-200/50 shadow-inner">
                        <button
                          onClick={() => setMode('voice')}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all',
                            mode === 'voice'
                              ? 'bg-white text-rangam-blue shadow-sm ring-1 ring-rangam-blue/5'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                          )}
                        >
                          <Mic size={12} /> Voice
                        </button>
                        <button
                          onClick={() => setMode('text')}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all',
                            mode === 'text'
                              ? 'bg-white text-rangam-blue shadow-sm ring-1 ring-rangam-blue/5'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                          )}
                        >
                          <MessageSquare size={12} /> Text
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Body: Inputs / Action Area */}
                  <div className="flex-1 relative min-h-0 bg-transparent">
                    {/* Scenario A: Answered (Retry / Feedback) */}
                    {isAnswered && !showAnswerPopover ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 p-4">
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold bg-slate-100 text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-200 hover:text-rangam-navy transition-all"
                        >
                          <RotateCcw size={16} /> Retry Your Answer
                        </button>

                        {answers[currentQuestion.id]?.analysis && (
                          <button
                            onClick={() => setShowPopover(true)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-rangam-blue hover:text-rangam-orange hover:bg-blue-50 transition-colors"
                          >
                            <Activity size={14} /> See Coach's Feedback
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Scenario B: Active Input */
                      <div className="h-full w-full">
                        {mode === 'voice' ? (
                          <div className="h-full w-full relative flex items-center justify-center">
                            {/* Visualizer Layer - Background */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
                              {isRecording && (
                                <AudioVisualizer
                                  stream={mediaStream}
                                  isRecording={isRecording}
                                  className="w-full h-full max-w-sm"
                                />
                              )}

                              {/* Processing State */}
                              {showAnswerPopover && currentAnswer && (
                                <span className="text-xs text-slate-400 font-medium animate-pulse">
                                  Processing...
                                </span>
                              )}
                            </div>

                            {/* Mic Button Layer - Foreground */}
                            <div className="relative z-10 flex flex-col items-center gap-3">
                              {!showRecordingPopover && (
                                <button
                                  onClick={handleToggleRecording}
                                  disabled={isInitializing}
                                  className={cn(
                                    'group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl',
                                    isInitializing
                                      ? 'bg-amber-100 text-amber-600 border-2 border-amber-200'
                                      : isRecording
                                        ? 'bg-red-50 text-red-500 border-2 border-red-200 scale-110 shadow-red-500/20'
                                        : 'bg-rangam-blue/10 text-rangam-blue border-4 border-rangam-blue/10 hover:border-rangam-blue/30 hover:scale-105 shadow-rangam-blue/5'
                                  )}
                                >
                                  {isInitializing ? (
                                    <Loader2 size={32} className="animate-spin" />
                                  ) : (
                                    <Mic
                                      size={32}
                                      className={cn(isRecording && 'animate-bounce')}
                                    />
                                  )}
                                </button>
                              )}

                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm border border-slate-100/50">
                                {isInitializing
                                  ? 'Connecting...'
                                  : isRecording
                                    ? 'Listening...'
                                    : 'Tap to Answer'}
                              </p>

                              {micPermissionError && (
                                <p className="text-red-400 text-[10px] bg-red-50 px-2 py-1 rounded border border-red-200 mt-2">
                                  Microphone Access Denied
                                </p>
                              )}
                            </div>

                            {/* Post-Recording Actions (Popover inline) */}
                            {(showRecordingPopover || showAnswerPopover) && (
                              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
                                {showRecordingPopover ? (
                                  <div className="flex flex-col items-center gap-4 animate-fadeIn p-6">
                                    <h3 className="text-lg font-semibold text-rangam-navy">
                                      Confirm Submission
                                    </h3>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={handleSubmitRecording}
                                        className="px-6 py-2.5 bg-rangam-blue text-white rounded-full text-sm font-bold shadow-lg shadow-rangam-blue/20 hover:bg-rangam-blue/90 hover:scale-105 transition-all"
                                      >
                                        Submit Answer
                                      </button>
                                      <button
                                        onClick={handleRetryRecording}
                                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-all"
                                      >
                                        Retry
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <SubmissionPopover
                                    isOpen={true}
                                    onRetry={handleRetry}
                                    onFeedback={() => {
                                      setShowAnswerPopover(false);
                                      if (currentAnswer?.analysis) setShowPopover(true);
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
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Text Mode Input */
                          <div className="h-full flex flex-col relative">
                            {showAnswerPopover && currentAnswer ? (
                              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
                                <SubmissionPopover
                                  isOpen={true}
                                  onRetry={handleRetry}
                                  onFeedback={() => {
                                    setShowAnswerPopover(false);
                                    if (currentAnswer?.analysis) setShowPopover(true);
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
                              <>
                                <textarea
                                  autoFocus
                                  className="flex-1 w-full p-4 bg-slate-50/90 text-slate-700 placeholder-slate-400 resize-none focus:outline-none text-base leading-relaxed custom-scrollbar"
                                  placeholder="Type your answer here..."
                                  value={textAnswer}
                                  onChange={(e) => setTextAnswer(e.target.value)}
                                />
                                <div className="flex justify-between items-center px-4 py-2 border-t border-slate-100 bg-slate-50/90">
                                  <span className="text-xs text-slate-400">
                                    {textAnswer.length} chars
                                  </span>
                                  <Button
                                    onClick={handleTextSubmit}
                                    disabled={!textAnswer.trim() || isTextSubmitting}
                                    size="sm"
                                    className="bg-rangam-blue text-white hover:bg-rangam-blue/90 shadow-sm"
                                  >
                                    {isTextSubmitting ? 'Sending...' : 'Submit'}{' '}
                                    <ArrowRight size={14} className="ml-2" />
                                  </Button>
                                </div>
                              </>
                            )}
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
              <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                <h3 className="font-semibold text-rangam-navy mb-4 px-2">Question List</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {session.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={cn(
                        'p-3 rounded-lg border text-sm transition-all cursor-pointer group',
                        idx === session.currentQuestionIndex
                          ? 'bg-blue-50 border-blue-200 text-rangam-blue shadow-sm'
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs opacity-50">Q{idx + 1}</span>
                        {session.answers[q.id] && (
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        )}
                      </div>
                      {/* Allow expanding truncated text */}
                      <p className="line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                        {q.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Overlay: Questions (Enhanced Close Button & Unlocked & High Z-Index) */}
            <AnimatePresence>
              {showMobileQuestions && (
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="fixed inset-x-0 bottom-0 top-16 z-30 bg-white md:hidden flex flex-col"
                  style={{ zIndex: 30 }}
                >
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-10 shrink-0 h-16">
                    <h3 className="font-semibold text-slate-800">Questions</h3>
                    <button
                      onClick={() => setShowMobileQuestions(false)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 text-slate-600 hover:bg-slate-200 transition-colors z-50 touch-manipulation"
                      aria-label="Close"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-3 pb-20">
                      {' '}
                      {/* Added pb-20 to ensure bottom is scrollable above footer */}
                      {session.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          onClick={() => {
                            triggerSilentAudio(); // Bless audio on navigation
                            goToQuestion(idx);
                            setShowMobileQuestions(false);
                          }}
                          className={cn(
                            'p-4 rounded-xl border text-sm transition-all active:scale-95 group',
                            idx === session.currentQuestionIndex
                              ? 'bg-blue-50 border-blue-200 text-rangam-blue shadow-sm'
                              : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Q{idx + 1}
                            </span>
                            {session.answers[q.id] && (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            )}
                          </div>
                          <p className="line-clamp-3 leading-relaxed group-hover:line-clamp-none transition-all">
                            {q.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer Controls */}
          <footer className="fixed bottom-0 left-0 right-0 md:static h-16 md:h-20 lg:h-24 bg-transparent grid grid-cols-1 md:grid-cols-[3fr_4fr_3fr] px-2 md:px-8 z-20 gap-6 pointer-events-none">
            {/* Middle Column Controls (Col 2) */}
            <div className="md:col-start-2 flex items-center justify-between w-full px-2 md:px-0 pointer-events-auto">
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  onClick={() => {
                    triggerSilentAudio();
                    handlePrev();
                  }}
                  disabled={isFirstQuestion}
                  variant="outline"
                  className="h-10 w-10 md:w-auto md:px-6 rounded-full flex items-center justify-center p-0 md:p-4 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  title="Previous Question"
                  aria-label="Previous Question"
                >
                  <ChevronLeft size={20} className="md:mr-2" />
                  <span className="hidden md:inline font-medium">Previous</span>
                </Button>

                <Button
                  onClick={() => {
                    triggerSilentAudio();
                    handleNextQuestion();
                  }}
                  disabled={isLastQuestion}
                  variant="outline"
                  className="h-10 w-10 md:w-auto md:px-6 rounded-full flex items-center justify-center p-0 md:p-4 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  title="Next Question"
                  aria-label="Next Question"
                >
                  <span className="hidden md:inline font-medium">Next</span>
                  <ChevronRight size={20} className="md:ml-2" />
                </Button>
              </div>

              <Button
                onClick={handleFinish}
                variant="default"
                className="px-4 md:px-8 bg-rangam-blue hover:bg-rangam-blue/90 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full font-medium"
              >
                <span className="hidden md:inline">Exit Session</span>
                <span className="md:hidden">Exit</span>
              </Button>
            </div>
          </footer>
        </>
      )}

      <MultiStepLoader
        loadingStates={
          mode === 'voice'
            ? [
                { text: 'Coach is analyzing your answer...' },
                { text: 'Generating feedback...' },
                { text: 'Noting your speaking delivery...' },
                { text: 'Finalizing review...' },
              ]
            : [
                { text: 'Coach is analyzing your answer...' },
                { text: 'Generating feedback...' },
                { text: 'Finalizing review...' },
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

      {/* Engagement Debug Overlay */}
      <EngagementDebugOverlay
        isVisible={showEngagementDebug}
        onClose={() => setShowEngagementDebug(false)}
        tracker={tracker}
      />

      {/* Hidden Debug Trigger (Bottom Right) */}
      <button
        className="fixed bottom-0 right-0 w-8 h-8 opacity-0 hover:opacity-10 z-60 cursor-help"
        onClick={() => setShowEngagementDebug((prev) => !prev)}
        title="Toggle Engagement Debugger"
      />

      <FeedbackModal
        isOpen={showPopover}
        onClose={() => setShowPopover(false)}
        question={currentQuestion}
        questionIndex={session.currentQuestionIndex}
        answer={
          currentQuestion
            ? answers[currentQuestion.id]
              ? {
                  text: answers[currentQuestion.id].text || '',
                  audioBlob: answers[currentQuestion.id].audioBlob,
                  analysis: answers[currentQuestion.id].analysis,
                }
              : { text: '', analysis: null }
            : { text: '', analysis: null }
        }
        blueprint={session.blueprint}
      />

      <RecordingConfirmationModal
        isOpen={showRecordingPopover}
        onConfirm={handleSubmitRecording}
        onRetry={handleRetryRecording}
      />

      <SubmissionPopover
        isOpen={showAnswerPopover && !!currentAnswer}
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
      />
    </div>
  );
};
