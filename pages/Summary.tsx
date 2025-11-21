import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2 } from '../components/Icons';
import { useSession } from '../hooks/useSession';
import { AnalysisResult } from '../types';
import { saveSession } from '../services/storageService';

const Summary: React.FC = () => {
    const navigate = useNavigate();
    const { session, resetSession } = useSession();
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const hasSaved = useRef(false);

    const calculateOverallScore = () => {
        const totalQs = session.questions.length;
        if (totalQs === 0) return 0;

        let scoreSum = 0;
        (Object.values(session.answers) as Array<{ audioBlob?: Blob; analysis: AnalysisResult | null }>).forEach(ans => {
            if (ans.analysis?.rating === 'Strong') scoreSum += 100;
            else if (ans.analysis?.rating === 'Good') scoreSum += 75;
            else scoreSum += 50;
        });

        return Math.round(scoreSum / totalQs);
    };

    const score = calculateOverallScore();

    // Auto-save session on mount
    useEffect(() => {
        if (!hasSaved.current && session.questions.length > 0) {
            saveSession(session, score);
            hasSaved.current = true;
        }
    }, [session, score]);

    const handleRestart = () => {
        resetSession();
        navigate('/');
    };

    const handleNewSession = () => {
        resetSession();
        navigate('/select-role');
    };

    const getRatingColor = (rating?: string) => {
        switch (rating) {
            case 'Strong': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Good': return 'bg-teal-100 text-teal-700 border-teal-200';
            default: return 'bg-orange-100 text-orange-700 border-orange-200'; // Needs Practice
        }
    };

    const answerEntries = Object.values(session.answers) as Array<{ audioBlob?: Blob; analysis: AnalysisResult | null }>;
    const strongCount = answerEntries.filter(a => a.analysis?.rating === 'Strong').length;
    const goodCount = answerEntries.filter(a => a.analysis?.rating === 'Good').length;
    const practiceCount = answerEntries.filter(a => a.analysis?.rating === 'Needs Practice').length;

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">
            {/* Use flex-1 with overflow-y-auto to ensure scrolling works within the fixed viewport */}
            <div className="flex-1 overflow-y-auto">
                <div className="w-full max-w-5xl mx-auto p-6 md:p-8 pb-32">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Interview Analysis</h2>
                            <p className="text-slate-500 mt-1">Comprehensive insights for <span className="font-semibold text-indigo-600">{session.role}</span> role</p>
                        </div>
                        <div className="flex gap-3 mt-4 md:mt-0">
                            <button onClick={handleRestart} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-white hover:border-slate-400 transition-all text-sm">
                                Exit
                            </button>
                            <button onClick={handleNewSession} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all text-sm shadow-lg shadow-slate-200">
                                New Practice Session
                            </button>
                        </div>
                    </div>

                    {/* Hero Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                        {/* Score Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="40"
                                        fill="transparent"
                                        stroke={score >= 80 ? '#10b981' : score >= 60 ? '#0d9488' : '#f97316'}
                                        strokeWidth="8"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                                        strokeLinecap="round"
                                        className="transform -rotate-90 origin-center transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-3xl font-bold text-slate-800">{score}%</span>
                                </div>
                            </div>
                            <h3 className="text-slate-600 font-medium">Readiness Score</h3>
                        </div>

                        {/* Breakdown Card */}
                        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Performance Breakdown</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="w-24 text-sm font-medium text-slate-500">Strong</div>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(strongCount / session.questions.length) * 100}%` }}></div>
                                    </div>
                                    <div className="w-8 text-right font-bold text-slate-800">{strongCount}</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-24 text-sm font-medium text-slate-500">Good</div>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(goodCount / session.questions.length) * 100}%` }}></div>
                                    </div>
                                    <div className="w-8 text-right font-bold text-slate-800">{goodCount}</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-24 text-sm font-medium text-slate-500">Practice</div>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(practiceCount / session.questions.length) * 100}%` }}></div>
                                    </div>
                                    <div className="w-8 text-right font-bold text-slate-800">{practiceCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Analysis List */}
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Detailed Question Review</h3>
                    <div className="space-y-4">
                        {session.questions.map((q, i) => {
                            const ans = session.answers[q.id];
                            const isExpanded = expandedQuestionId === q.id;

                            return (
                                <div key={q.id} className={`bg-white rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                                    <button
                                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                        className="w-full flex items-center justify-between p-6 text-left"
                                    >
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${ans?.analysis?.rating === 'Strong' ? 'bg-emerald-100 text-emerald-700' :
                                                ans?.analysis?.rating === 'Good' ? 'bg-teal-100 text-teal-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-slate-800 truncate pr-4">{q.text}</h4>
                                                {!isExpanded && <p className="text-xs text-slate-400 mt-1 truncate">Click to view analysis</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRatingColor(ans?.analysis?.rating)}`}>
                                                {ans?.analysis?.rating || "Skipped"}
                                            </span>
                                            <ChevronRight className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={20} />
                                        </div>
                                    </button>

                                    {isExpanded && ans?.analysis && (
                                        <div className="px-6 pb-8 pt-2 border-t border-slate-50 animate-fade-in">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                                                {/* Left: Transcript & Audio */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Answer</h5>
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-sm leading-relaxed italic mb-4">
                                                        "{ans.analysis.transcript}"
                                                    </div>
                                                    {/* Terms */}
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {ans.analysis.keyTerms.map((term, idx) => (
                                                            <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                                                                {term}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Right: Feedback */}
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Feedback & Coaching</h5>
                                                    <ul className="space-y-3">
                                                        {ans.analysis.feedback.map((fb, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                <span>{fb}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Summary;
