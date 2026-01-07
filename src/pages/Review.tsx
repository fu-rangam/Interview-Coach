import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, RefreshCw, Award, ChevronRight, MessageSquare, CheckCircle2, Activity, Star, CheckSquare } from '../components/Icons';
import { useSession } from '../hooks/useSession';
import { generateStrongResponse } from '../services/geminiService';
import SkeletonLoader from '../components/SkeletonLoader';
import QuestionTips from '../components/QuestionTips';
import Loader from '../components/Loader';

const Review: React.FC = () => {
    const navigate = useNavigate();
    const { session, nextQuestion, updateAnswerAnalysis, isLoading } = useSession();
    const [isGeneratingStrongResponse, setIsGeneratingStrongResponse] = useState(false);

    const currentQ = session?.questions?.[session.currentQuestionIndex];
    const answer = currentQ ? session?.answers?.[currentQ.id] : undefined;
    const isLastQuestion = session?.questions ? session.currentQuestionIndex === session.questions.length - 1 : false;

    // Trigger lazy generation of Strong Response
    useEffect(() => {
        const fetchStrongResponse = async () => {
            if (!currentQ || !answer) return;

            if (answer?.analysis && !answer.analysis.strongResponse && !isGeneratingStrongResponse && currentQ.tips) {
                setIsGeneratingStrongResponse(true);
                try {
                    const result = await generateStrongResponse(currentQ.text, currentQ.tips);
                    updateAnswerAnalysis(currentQ.id, result);
                } catch (error) {
                    console.error("Failed to generate strong response", error);
                } finally {
                    setIsGeneratingStrongResponse(false);
                }
            }
        };

        fetchStrongResponse();
    }, [answer, currentQ, isGeneratingStrongResponse, updateAnswerAnalysis]);

    if (isLoading) return <SkeletonLoader />;

    // Guard against direct access if session is empty (e.g. manual nav to /review without data)
    if (!session || !session.questions || session.questions.length === 0) {
        return <div className="p-8 text-center text-slate-500">No session data found. Redirecting...</div>;
    }

    // Extra guard for currentQ
    if (!currentQ) return <SkeletonLoader />;

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            navigate('/summary');
        } else {
            nextQuestion();
            navigate('/interview');
        }
    };

    const handleRedo = () => {
        navigate('/interview');
    };

    const getRatingColor = (rating?: string) => {
        switch (rating) {
            case 'Strong': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Good': return 'bg-teal-100 text-teal-700 border-teal-200';
            default: return 'bg-orange-100 text-orange-700 border-orange-200'; // Developing / Needs Practice
        }
    };

    const ActionButtons = () => (
        <div className="flex gap-4">
            <button onClick={handleRedo} className="flex-1 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                <RefreshCw size={18} /> Retry
            </button>
            <button onClick={handleNextQuestion} className="flex-2 px-8 py-3 rounded-xl bg-[#376497] text-white font-medium hover:bg-[#25466c] shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all hover:translate-x-1">
                {isLastQuestion ? (
                    <>Finish & Analyze <Award size={18} /></>
                ) : (
                    <>Next Question <ChevronRight size={18} /></>
                )}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
            <div className="flex flex-col md:flex-row h-full w-full overflow-y-auto md:overflow-hidden scroll-pb-24">
                {/* Left Panel: Transcript & Feedback */}
                <div className="w-full md:w-1/2 h-auto md:h-full md:overflow-y-auto border-r border-slate-100 bg-white">
                    <div className="p-6 md:p-12 max-w-xl mx-auto pb-12 md:pb-24">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Question {session.currentQuestionIndex + 1}</h3>
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{currentQ.text}</h2>
                            </div>
                        </div>

                        {/* Transcript */}
                        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 shadow-inner relative group">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                                <Mic size={14} /> Your Answer
                            </h4>
                            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                                {answer?.analysis?.transcript}
                            </p>
                        </div>

                        {/* AI Insights (Moved from Right) */}
                        <div className="space-y-6 mb-8">
                            {/* Feedback Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                            <MessageSquare size={20} />
                                        </div>
                                        <h4 className="font-semibold text-slate-800">Feedback</h4>
                                    </div>
                                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getRatingColor(answer?.analysis?.rating)}`}>
                                        {answer?.analysis?.rating}
                                    </span>
                                </div>
                                <ul className="space-y-4">
                                    {answer?.analysis?.feedback.map((point, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-slate-600 leading-relaxed">{point}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Delivery Feedback Card - Only show if available */}
                            {(answer?.analysis?.deliveryStatus || answer?.analysis?.deliveryTips) && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Activity size={20} />
                                        </div>
                                        <h4 className="font-semibold text-slate-800">Speaking Delivery</h4>
                                        {answer?.analysis?.deliveryStatus && (
                                            <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                {answer.analysis.deliveryStatus}
                                            </span>
                                        )}
                                    </div>
                                    {answer?.analysis?.deliveryTips && (
                                        <ul className="space-y-3">
                                            {answer.analysis.deliveryTips.map((tip, i) => (
                                                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                                    <p className="text-slate-600 text-sm leading-relaxed">{tip}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Key Terms Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-[#376497]">
                                        <Award size={20} />
                                    </div>
                                    <h4 className="font-semibold text-slate-800">Key Professional Terms</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {answer?.analysis?.keyTerms.map((term, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">
                                            {term}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions (Desktop Only) */}
                        <div className="hidden md:block pt-8 border-t border-slate-100">
                            <ActionButtons />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Strong Response & Why This Works */}
                <div className="w-full md:w-1/2 h-auto md:h-full md:overflow-y-auto bg-slate-50/80 border-t md:border-t-0 md:border-l border-slate-200">
                    <div className="p-6 md:p-12 max-w-xl mx-auto pb-24">
                        {/* Strong Response Card */}
                        {isGeneratingStrongResponse && !answer?.analysis?.strongResponse ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-75 animate-pulse">
                                <Loader />
                                <p className="mt-4 text-slate-400 text-sm font-medium">Crafting the perfect response...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden animate-fade-in">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                        <Star size={18} className="text-[#376497] fill-current" />
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Strong Response Example</h3>
                                    </div>
                                    <div className="p-6 md:p-8">
                                        {answer?.analysis?.strongResponse ? (
                                            <p className="text-slate-700 leading-relaxed text-lg italic">
                                                "{answer.analysis.strongResponse}"
                                            </p>
                                        ) : (
                                            <div className="flex flex-col items-center text-center p-4">
                                                <p className="text-slate-400 italic mb-2">Example response not available.</p>
                                                <p className="text-xs text-slate-300">Analysis may have been interrupted.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Why This Works Section */}
                                {answer?.analysis?.whyThisWorks && (
                                    <div className="animate-fade-in">
                                        <div className="flex items-center gap-2 text-[#376497] mb-4">
                                            <CheckSquare size={20} className="stroke-[2.5]" />
                                            <h3 className="font-display font-bold text-slate-800 text-lg">Why This Works</h3>
                                        </div>
                                        <p className="text-slate-500 text-sm mb-6">Deep dive into the strategies used in the example above.</p>

                                        <QuestionTips tips={answer.analysis.whyThisWorks} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Actions Footer (Fixed) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-50">
                <ActionButtons />
            </div>
        </div>
    );
};

export default Review;
