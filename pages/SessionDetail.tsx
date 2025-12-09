import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Calendar, Award, User, MessageSquare, Activity, Lightbulb } from 'lucide-react';
import { getSessionById, SessionHistory } from '../services/storageService';

const SessionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [sessionHistory, setSessionHistory] = useState<SessionHistory | null>(null);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const data = getSessionById(id);
            setSessionHistory(data);
            // Default to expanding the first question
            if (data && data.session.questions.length > 0) {
                setExpandedQuestionId(data.session.questions[0].id);
            }
        }
    }, [id]);

    const toggleQuestion = (questionId: string) => {
        // If expanding a new question (not just collapsing the current one)
        if (expandedQuestionId !== questionId) {
            setExpandedQuestionId(questionId);

            // Wait for render/transition to tick, then smooth scroll
            setTimeout(() => {
                const element = document.getElementById(`question-${questionId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 350); // Slightly longer than transition duration (300ms)
        } else {
            // Collapsing current
            setExpandedQuestionId(null);
        }
    };

    if (!sessionHistory) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500">
                <p className="text-xl font-medium mb-4">Session not found.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
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
            <div className="flex-1 overflow-y-auto py-8 px-4 sm:px-6">
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
                                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
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
                                        {score >= 80 ? 'Excellent' : score >= 60 ? 'Good Start' : 'Needs Practice'}
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
                                <div
                                    key={question.id}
                                    id={`question-${question.id}`}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200"
                                >
                                    {/* Question Header (Toggle Trigger) */}
                                    <div
                                        onClick={() => toggleQuestion(question.id)}
                                        className={`p-6 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-200' : ''}`}
                                    >
                                        <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center font-bold transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-semibold transition-colors ${isExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {question.text}
                                            </h3>
                                        </div>
                                        <div className="mt-1 text-slate-400">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {/* Expandable Content Wrapper */}
                                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                            <div className="p-6 sm:p-8 space-y-8 border-t border-slate-100">
                                                {/* User Answer */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                                        <User size={16} /> Your Answer
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-xl text-slate-700 leading-relaxed border border-slate-100 italic">
                                                        "{analysis?.transcript || answerData.text || "No transcript available."}"
                                                    </div>
                                                </div>

                                                {/* AI Analysis */}
                                                {analysis && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* Feedback */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-indigo-500 uppercase tracking-wider">
                                                                <MessageSquare size={16} /> Feedback
                                                            </div>
                                                            <ul className="space-y-3">
                                                                {analysis.feedback.map((point, i) => (
                                                                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                                                                        {point}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Delivery & Terms */}
                                                        <div className="space-y-6">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-emerald-600 uppercase tracking-wider">
                                                                    <Activity size={16} /> Rating: {analysis.rating}
                                                                </div>
                                                                {analysis.deliveryStatus && (
                                                                    <div className="mb-4 text-sm text-slate-600">
                                                                        <span className="font-medium text-slate-900">Delivery:</span> {analysis.deliveryStatus}
                                                                    </div>
                                                                )}
                                                                {analysis.deliveryTips && analysis.deliveryTips.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        {analysis.deliveryTips.map((tip, i) => (
                                                                            <div key={i} className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded lg">
                                                                                <Lightbulb size={12} className="mt-0.5 text-amber-500 flex-shrink-0" />
                                                                                {tip}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                                                    Key Terms
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {analysis.keyTerms.map((term, i) => (
                                                                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                                                                            {term}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetail;
