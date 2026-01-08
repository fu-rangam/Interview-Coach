import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, MessageSquare, Send, Lightbulb, Check, ChevronLeft, StopCircle, List, X } from '../components/Icons';
import AudioVisualizer from '../components/AudioVisualizer';
import QuestionCard from '../components/QuestionCard';
import QuestionTips from '../components/QuestionTips';
import Loader from '../components/Loader';
import SkeletonLoader from '../components/SkeletonLoader';
import { useSession } from '../hooks/useSession';
import { useRecording } from '../hooks/useRecording';
import { useTextAnswer } from '../hooks/useTextAnswer';
import { analyzeAnswer } from '../services/geminiService';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useGuestTracker } from '../hooks/useGuestTracker';
import { useAuth } from '../context/AuthContext';
import QuestionList from '../components/QuestionList';

const Interview: React.FC = () => {
    const navigate = useNavigate();
    const { session, saveAnswer, loadTipsForQuestion, goToQuestion, isLoading } = useSession();
    const { isRecording, mediaStream, startRecording, stopRecording } = useRecording();
    const { text, error: textError, handleTextChange, submitTextAnswer, resetText, maxLength } = useTextAnswer();
    const { hasCompletedSession } = useGuestTracker();
    const { user } = useAuth();

    const [processingState, setProcessingState] = useState<{ isActive: boolean; text: string }>({ isActive: false, text: '' });
    const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
    const [error, setError] = useState<string | null>(null);
    const [mobileOverlay, setMobileOverlay] = useState<'none' | 'questions' | 'tips'>('none');

    const hasLoggedStart = React.useRef(false);

    // Safe access to current question
    const currentQ = session.questions[session.currentQuestionIndex];

    const decodeHtml = (html: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    // Redirect hooked guests
    React.useEffect(() => {
        if (!user && hasCompletedSession) {
            navigate('/auth?mode=signup');
        }
    }, [user, hasCompletedSession, navigate]);

    // Log Session Start (AUTOMATIC)
    React.useEffect(() => {
        if (currentQ && !hasLoggedStart.current) {
            hasLoggedStart.current = true;
            import('../services/auditLogger').then(({ logAuditEvent }) => {
                logAuditEvent('SESSION_START', { questionId: currentQ.id });
            });
        }
    }, [currentQ?.id]);

    // Redirect if no questions (e.g. page reload on empty session) - BUT WAIT FOR LOADING
    React.useEffect(() => {
        if (!isLoading && session.questions.length === 0) {
            navigate('/select-role');
        }
    }, [session.questions, isLoading, navigate]);

    // Lazy load tips when current question changes
    React.useEffect(() => {
        if (currentQ && !currentQ.tips) {
            loadTipsForQuestion(currentQ.id);
        }
    }, [currentQ?.id, currentQ?.tips, loadTipsForQuestion]);

    if (isLoading || !currentQ) return <SkeletonLoader variant="interview" />;

    const handleStartRecording = async () => {
        try {
            await startRecording();
        } catch (err) {
            setError("Microphone access is required to use this app.");
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleStopRecording = async () => {
        const blob = await stopRecording();
        await processAnswer(blob);
    };

    const handleTextSubmit = async () => {
        const validText = submitTextAnswer();
        if (validText) {
            await processAnswer(validText);
        }
    };

    const processAnswer = async (input: Blob | string) => {
        setProcessingState({ isActive: true, text: 'Analyzing your answer...' });

        try {
            const result = await analyzeAnswer(currentQ.text, input);

            saveAnswer(currentQ.id, {
                audioBlob: typeof input !== 'string' ? input : undefined,
                text: typeof input === 'string' ? input : undefined,
                analysis: result
            });
            import('../services/auditLogger').then(({ logAuditEvent }) => {
                logAuditEvent('ANSWER_RECORDED', { questionId: currentQ.id, type: typeof input === 'string' ? 'text' : 'audio' });
            });

            resetText();
            navigate('/review');
        } catch (e) {
            setError("Failed to analyze answer. Please try again.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setProcessingState({ isActive: false, text: '' });
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">
            {/* ... */}

            {processingState.isActive ? (
                <SkeletonLoader variant="review" text={processingState.text} />
            ) : (
                <div className="flex flex-col lg:flex-row h-full relative">
                    {/* Error Toast */}
                    {error && (
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-60 bg-rose-100 border border-rose-200 text-rose-700 px-6 py-3 rounded-full shadow-lg animate-fade-in font-medium flex items-center gap-2">
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Mobile: Overlays */}
                    {mobileOverlay !== 'none' && (
                        <div className="lg:hidden absolute inset-0 z-50 bg-white flex flex-col animate-fade-in">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shadow-sm shrink-0">
                                <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider">
                                    {mobileOverlay === 'questions' ? 'Question Set' : 'Tips & Advice'}
                                </h3>
                                <button
                                    onClick={() => setMobileOverlay('none')}
                                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {mobileOverlay === 'questions' ? (
                                    <QuestionList
                                        questions={session.questions}
                                        currentIndex={session.currentQuestionIndex}
                                        answers={session.answers}
                                        onSelect={(idx) => {
                                            goToQuestion(idx);
                                            setMobileOverlay('none');
                                        }}
                                    />
                                ) : (
                                    <div className="p-6">
                                        {currentQ?.tips ? (
                                            <QuestionTips tips={currentQ.tips} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 opacity-75">
                                                <Loader />
                                                <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Consulting Coach...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Left Column (20%): Question Set (Desktop) */}
                    <div className="hidden lg:flex lg:w-[20%] h-full flex-col bg-white border-r border-slate-200 z-20">
                        <QuestionList
                            questions={session.questions}
                            currentIndex={session.currentQuestionIndex}
                            answers={session.answers}
                            onSelect={goToQuestion}
                            onBack={() => navigate('/')}
                        />
                    </div>

                    {/* Middle Column (45%): Main Content */}
                    <div className="w-full lg:w-[45%] h-full flex flex-col relative bg-white lg:bg-slate-50 lg:border-r border-slate-200 shadow-sm lg:shadow-none z-10">
                        {/* Header */}
                        <div className="flex-none px-4 lg:px-8 py-4 lg:py-6 flex items-center justify-between bg-white lg:bg-transparent z-20 border-b lg:border-0 border-slate-100">
                            <div className="flex items-center gap-2">
                                {/* Mobile: Back Button */}
                                <button
                                    onClick={() => navigate('/')}
                                    className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Mobile: Question Set Button */}
                                <button
                                    onClick={() => setMobileOverlay('questions')}
                                    className="lg:hidden flex items-center gap-2 text-slate-600 hover:text-[#376497] font-semibold text-sm px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <List size={20} />
                                    <span>Question Set</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Mobile: Tips Button */}
                                <button
                                    onClick={() => setMobileOverlay('tips')}
                                    className="lg:hidden flex items-center gap-2 text-amber-600 font-semibold text-sm px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100"
                                >
                                    <Lightbulb size={16} className="fill-current" />
                                    <span>Tips</span>
                                </button>

                                <span className="hidden lg:inline-block text-xs font-bold text-[#376497] uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                                    {session.role || "Interview Session"}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 flex flex-col items-center">
                            <div className="w-full max-w-xl mx-auto space-y-6 lg:space-y-8 mt-2 lg:mt-0">
                                <QuestionCard
                                    question={currentQ ? decodeHtml(currentQ.text) : "Loading..."}
                                    role={session.role}
                                    currentIndex={session.currentQuestionIndex}
                                    total={session.questions.length}
                                    hideHeader={true}
                                />

                                {/* Input Method Toggle */}
                                <div className="flex p-1.5 bg-slate-100 rounded-xl w-full max-w-xs mx-auto shadow-inner">
                                    <button
                                        onClick={() => setActiveTab('voice')}
                                        className={cn(
                                            "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                                            activeTab === 'voice'
                                                ? "bg-white text-[#376497] shadow-sm shadow-slate-200"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                        )}
                                    >
                                        <Mic size={16} /> Voice
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('text')}
                                        className={cn(
                                            "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                                            activeTab === 'text'
                                                ? "bg-white text-[#376497] shadow-sm shadow-slate-200"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                        )}
                                    >
                                        <MessageSquare size={16} /> Text
                                    </button>
                                </div>

                                {/* Voice Input Area */}
                                {activeTab === 'voice' && (
                                    <div className="flex flex-col items-center w-full animate-fade-in py-4">
                                        <div className="w-full h-40 flex items-center justify-center mb-4 relative">
                                            {isRecording ? (
                                                <div className="w-full relative">
                                                    <div className="absolute inset-0 bg-[#376497]/5 blur-3xl rounded-full animate-pulse"></div>
                                                    <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
                                                </div>
                                            ) : (
                                                <div className="text-slate-400 text-sm font-medium text-center bg-slate-50 px-8 py-4 rounded-2xl border border-dashed border-slate-200 w-full max-w-xs">
                                                    Click the microphone below to start recording your answer.
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center relative">
                                            {!isRecording ? (
                                                <button
                                                    onClick={handleStartRecording}
                                                    className="group relative w-24 h-24 bg-linear-to-br from-[#376497] to-[#25466c] text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition-colors"></div>
                                                    <Mic size={36} className="drop-shadow-sm" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleStopRecording}
                                                    className="group w-24 h-24 bg-white border-4 border-rose-100 text-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-rose-100 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <StopCircle size={48} fill="currentColor" className="opacity-90 relative z-10" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-4 text-slate-400 font-semibold tracking-wider text-xs uppercase">
                                            {isRecording ? <span className="text-rose-500 animate-pulse">● Recording in progress</span> : "Ready to Record"}
                                        </p>
                                    </div>
                                )}

                                {/* Text Input Area */}
                                {activeTab === 'text' && (
                                    <div className="w-full animate-fade-in flex flex-col h-[300px]">
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 relative flex-1 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-[#376497]/50">
                                            <textarea
                                                value={text}
                                                onChange={(e) => handleTextChange(e.target.value)}
                                                placeholder="Type your answer here..."
                                                className="w-full h-full p-6 text-slate-700 resize-none outline-none text-lg leading-relaxed bg-transparent rounded-xl"
                                                maxLength={maxLength}
                                            />
                                            <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                                <span className={cn("text-xs font-semibold px-2 py-1 rounded bg-slate-100",
                                                    text.length > maxLength * 0.9 ? 'text-amber-600 bg-amber-50' : 'text-slate-400'
                                                )}>
                                                    {text.length} / {maxLength}
                                                </span>
                                            </div>
                                        </div>
                                        {textError && <p className="text-xs text-rose-500 font-medium mt-2 px-2">{textError}</p>}

                                        <div className="flex justify-end mt-4">
                                            <Button
                                                onClick={handleTextSubmit}
                                                disabled={text.trim().length < 10}
                                                className="px-8 h-12 text-base shadow-lg shadow-blue-100"
                                            >
                                                Submit <Send size={16} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (35%): Tips (Desktop) */}
                    <div className="hidden lg:flex lg:w-[35%] h-full bg-slate-50/50 flex-col border-l border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-200/50 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex items-center gap-2 text-amber-600 mb-1">
                                <Lightbulb size={20} className="fill-current opacity-20" />
                                <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider">Tips & Advice</h3>
                            </div>
                            <p className="text-sm text-slate-500">Key strategies for this specific question</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {currentQ?.tips ? (
                                <QuestionTips tips={currentQ.tips} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-75">
                                    <Loader />
                                    <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Consulting Coach...</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Interview;
