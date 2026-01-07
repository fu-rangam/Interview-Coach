import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Award, User, MessageSquare, Activity, Lightbulb, CheckCircle2, Star, CheckSquare } from 'lucide-react';
import { fetchSessionById, SessionHistory } from '../services/storageService';
import Loader from '../components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../lib/utils';
import QuestionTips from '../components/QuestionTips';

const SessionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sessionHistory, setSessionHistory] = useState<SessionHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    useEffect(() => {
        const loadSession = async () => {
            if (id) {
                setLoading(true);
                const data = await fetchSessionById(id);
                setSessionHistory(data);

                // Default to expanding the first question
                if (data && data.session.questions.length > 0) {
                    setExpandedQuestionId(data.session.questions[0].id);
                }
                setLoading(false);
            }
        };
        loadSession();
    }, [id]);

    const decodeHtml = (html: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    const toggleQuestion = (questionId: string) => {
        if (expandedQuestionId !== questionId) {
            setExpandedQuestionId(questionId);
            setTimeout(() => {
                const element = document.getElementById(`question-${questionId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 350);
        } else {
            setExpandedQuestionId(null);
        }
    };

    const getRatingColor = (rating?: string) => {
        switch (rating) {
            case 'Strong': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Good': return 'bg-teal-100 text-teal-700 border-teal-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    if (!sessionHistory) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500">
                <p className="text-xl font-medium mb-4">Session not found.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-[#376497] hover:text-[#25466c] font-medium"
                >
                    <ChevronLeft size={20} /> Back to Dashboard
                </button>
            </div>
        );
    }

    const { session, role, date, score } = sessionHistory;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto min-h-0 py-8 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto pb-12">
                    {/* Header */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft size={20} /> Back to History
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-blue-100 text-[#376497] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {role}
                                    </span>
                                    <span className="text-slate-400 text-sm flex items-center gap-1">
                                        <Calendar size={14} /> {date}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900">Interview Session Review</h1>
                                {session.jobDescription && (
                                    <p className="text-slate-500 mt-2 text-sm line-clamp-2">
                                        Context: {session.jobDescription}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm ${score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                    score >= 60 ? 'bg-teal-100 text-teal-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                    {score}
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Score</div>
                                    <div className="text-sm font-medium text-slate-600">
                                        {score >= 80 ? 'Excellent' : score >= 60 ? 'Good Start' : 'Developing'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions & Analysis */}
                    <div className="space-y-4">
                        {session.questions.map((question, index) => {
                            const answerData = session.answers[question.id];
                            const analysis = answerData?.analysis;
                            const isExpanded = expandedQuestionId === question.id;

                            if (!answerData) return null;

                            return (
                                <Card key={question.id} id={`question-${question.id}`} className={cn("border-slate-200 transition-all duration-300", isExpanded ? "shadow-md ring-1 ring-blue-50 border-blue-200" : "hover:border-blue-200")}>
                                    <div
                                        onClick={() => toggleQuestion(question.id)}
                                        className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 cursor-pointer gap-4"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={cn("shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5",
                                                analysis?.rating === 'Strong' ? 'bg-emerald-100 text-emerald-700' :
                                                    analysis?.rating === 'Good' ? 'bg-teal-100 text-teal-700' :
                                                        'bg-amber-100 text-amber-700'
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-lg leading-snug">{question.text}</h4>
                                                {!isExpanded && <p className="text-sm text-slate-400 mt-2 font-medium">Click to view full analysis</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 pl-12 md:pl-0">
                                            <ChevronRight className={cn("text-slate-400 transition-transform duration-300", isExpanded && "rotate-90")} size={20} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-6 pb-8 pt-2 border-t border-slate-50 animate-fade-in bg-slate-50/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                                {/* Left Column: Transcript & Analysis */}
                                                <div>
                                                    {/* User Answer */}
                                                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 shadow-inner relative group">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wide flex items-center gap-2">
                                                            <User size={14} /> Your Answer
                                                        </h4>
                                                        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                                                            {decodeHtml(analysis?.transcript || answerData.text || "No transcript available.")}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-6 mb-8">
                                                        {/* Feedback */}
                                                        {analysis?.feedback && (
                                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                                            <MessageSquare size={20} />
                                                                        </div>
                                                                        <h4 className="font-semibold text-slate-800">Feedback</h4>
                                                                    </div>
                                                                    <span className={cn("px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider", getRatingColor(analysis?.rating))}>
                                                                        {analysis.rating}
                                                                    </span>
                                                                </div>
                                                                <ul className="space-y-4">
                                                                    {analysis.feedback.map((point, i) => (
                                                                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                                            <p className="text-slate-600 leading-relaxed">{point}</p>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Speaking Delivery */}
                                                        {(analysis?.deliveryStatus || analysis?.deliveryTips) && (
                                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                                        <Activity size={20} />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-800">Speaking Delivery</h4>
                                                                    {analysis.deliveryStatus && (
                                                                        <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                                            {analysis.deliveryStatus}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {analysis.deliveryTips && analysis.deliveryTips.length > 0 && (
                                                                    <ul className="space-y-3">
                                                                        {analysis.deliveryTips.map((tip, i) => (
                                                                            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                                                                <p className="text-slate-600 text-sm leading-relaxed">{tip}</p>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Key Professional Terms */}
                                                        {analysis?.keyTerms && analysis.keyTerms.length > 0 && (
                                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="p-2 bg-blue-50 rounded-lg text-[#376497]">
                                                                        <Award size={20} />
                                                                    </div>
                                                                    <h4 className="font-semibold text-slate-800">Key Professional Terms</h4>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {analysis.keyTerms.map((term, i) => (
                                                                        <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium border border-slate-200">
                                                                            {term}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column: Strong Response & Why This Works */}
                                                <div>
                                                    {/* Strong Response Card */}
                                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                                                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                                            <Star size={18} className="text-[#376497] fill-current" />
                                                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Strong Response Example</h3>
                                                        </div>
                                                        <div className="p-6">
                                                            {analysis?.strongResponse ? (
                                                                <p className="text-slate-700 leading-relaxed text-lg italic">
                                                                    "{analysis.strongResponse}"
                                                                </p>
                                                            ) : (
                                                                <div className="text-center py-4">
                                                                    <p className="text-slate-400 italic mb-1">Example response not available.</p>
                                                                    <p className="text-xs text-slate-300">Analysis may be incomplete.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Why This Works Section */}
                                                    {analysis?.whyThisWorks && (
                                                        <div className="animate-fade-in">
                                                            <div className="flex items-center gap-2 text-[#376497] mb-4">
                                                                <CheckSquare size={18} className="stroke-[2.5]" />
                                                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Why This Works</h3>
                                                            </div>
                                                            {/* Reuse QuestionTips component but pass whyThisWorks data */}
                                                            <QuestionTips tips={analysis.whyThisWorks} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetail;
