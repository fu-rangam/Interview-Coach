import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, RefreshCw, Award, ChevronRight, MessageSquare, CheckCircle2, Activity } from '../components/Icons';
import { useSession } from '../hooks/useSession';

const Review: React.FC = () => {
    const navigate = useNavigate();
    const { session, nextQuestion } = useSession();

    const currentQ = session.questions[session.currentQuestionIndex];
    const answer = session.answers[currentQ.id];
    const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;

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
            default: return 'bg-orange-100 text-orange-700 border-orange-200'; // Needs Practice
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-white overflow-y-auto md:overflow-hidden">
            {/* Left Panel: Question & Transcript */}
            <div className="w-full md:w-1/2 h-auto md:h-full md:overflow-y-auto border-r border-slate-100 bg-white">
                <div className="p-6 md:p-12 max-w-xl mx-auto pb-12 md:pb-24">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Question {session.currentQuestionIndex + 1}</h3>
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-tight">{currentQ.text}</h2>

                    <div className="bg-slate-50 p-8 rounded-2xl mb-8 border border-slate-100 shadow-inner">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                            <Mic size={14} /> Your Transcript
                        </h4>
                        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                            {answer?.analysis?.transcript}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-slate-100">
                        <button onClick={handleRedo} className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                            <RefreshCw size={18} /> Retry
                        </button>
                        <button onClick={handleNextQuestion} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 ml-auto transition-all hover:translate-x-1">
                            {isLastQuestion ? (
                                <>Finish & Analyze <Award size={18} /></>
                            ) : (
                                <>Next Question <ChevronRight size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Insights */}
            <div className="w-full md:w-1/2 h-auto md:h-full md:overflow-y-auto bg-slate-50/80">
                <div className="p-6 md:p-12 max-w-xl mx-auto pb-24">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-slate-800">AI Insights</h3>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border ${getRatingColor(answer?.analysis?.rating)}`}>
                            {answer?.analysis?.rating} {answer?.analysis?.rating === 'Needs Practice' ? '' : 'Match'}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {/* Key Terms Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
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

                        {/* Delivery Feedback Card - Only show if available */}
                        {(answer?.analysis?.deliveryStatus || answer?.analysis?.deliveryTips) && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
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

                        {/* Feedback Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <MessageSquare size={20} />
                                </div>
                                <h4 className="font-semibold text-slate-800">Feedback</h4>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Review;
