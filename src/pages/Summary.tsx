import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2, Lock, Share2, Download, Home, RotateCcw } from '../components/Icons';
import { User, MessageSquare, Activity, Award, Star, CheckSquare } from 'lucide-react';
import QuestionTips from '../components/QuestionTips';
import { useSession } from '../hooks/useSession';
import { AnalysisResult } from '../types';
import { saveSession, updateHistorySession } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useGuestTracker } from '../hooks/useGuestTracker';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { cn } from '../lib/utils'; // Assuming this exists from Shadcn setup

const Summary: React.FC = () => {
    const navigate = useNavigate();
    const { session, resetSession } = useSession();
    const { user } = useAuth();
    const { markSessionComplete } = useGuestTracker();
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const historyId = useRef<string | null>(null);
    const savePromiseRef = useRef<Promise<string | null> | null>(null);

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

    // Side Effects: Save (if user) and Track (if guest)
    useEffect(() => {
        const saveOrUpdate = async () => {
            if (session.questions.length > 0) {
                // Determine ID if not present
                if (!historyId.current) {
                    if (!savePromiseRef.current) {
                        // Initiate the single creation request
                        savePromiseRef.current = (async () => {
                            if (user) {
                                return saveSession(session, score);
                            } else {
                                markSessionComplete();
                                return saveSession(session, score);
                            }
                        })();
                    }

                    // Wait for the creation to finish
                    const id = await savePromiseRef.current;
                    historyId.current = id;
                }

                // Perform update (Debouncing handled by storage logic overhead or purely sequential awaits)
                if (historyId.current) {
                    await updateHistorySession(historyId.current, session, score);
                }
            }
        };

        saveOrUpdate();
    }, [session, score, user, markSessionComplete]);

    const handleExit = () => {
        resetSession();
        navigate('/');
    };

    const handleSignup = () => {
        navigate('/auth?mode=signup');
    };

    const handleNewSession = () => {
        resetSession();
        navigate('/select-role');
    };

    const getRatingColor = (rating?: string) => {
        switch (rating) {
            case 'Strong': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Good': return 'bg-teal-100 text-teal-700 border-teal-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200'; // Developing / Needs Practice
        }
    };

    const answerEntries = Object.values(session.answers) as Array<{ audioBlob?: Blob; analysis: AnalysisResult | null }>;
    const strongCount = answerEntries.filter(a => a.analysis?.rating === 'Strong').length;
    const goodCount = answerEntries.filter(a => a.analysis?.rating === 'Good').length;
    const practiceCount = answerEntries.filter(a => a.analysis?.rating === 'Developing' || a.analysis?.rating === 'Needs Practice').length;

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">
            <div className="flex-1 overflow-y-auto">
                <div className="w-full max-w-6xl mx-auto p-8 lg:p-12 pb-32">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                        <div>
                            <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Interview Analysis</h2>
                            <p className="text-lg text-slate-500 mt-2">Personalized insights for <span className="font-semibold text-[#376497]">{session.role}</span></p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleExit} className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                                <Home size={18} /> Home
                            </button>
                            {user ? (
                                <button onClick={handleNewSession} className="text-slate-500 hover:text-[#376497] font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                                    <RotateCcw size={18} /> New Session
                                </button>
                            ) : (
                                <Button onClick={handleSignup} className="bg-[#376497] hover:bg-[#25466c] text-white gap-2 shadow-lg shadow-blue-200">
                                    Create Account <ChevronRight size={16} />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* GUEST BANNER */}
                    {!user && (
                        <div className="bg-linear-to-r from-[#376497] to-[#1e3a5f] rounded-3xl p-8 mb-12 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <h3 className="text-2xl font-bold mb-3 font-display">Keep your momentum going.</h3>
                                    <p className="text-blue-100 text-lg max-w-xl leading-relaxed">Create an account to unlock your personal dashboard, track your improvement over time, and access deeper AI coaching insights.</p>
                                </div>
                                <Button onClick={handleSignup} size="lg" className="bg-white text-[#376497] hover:bg-blue-50 font-bold shadow-xl border-none">
                                    Create Account
                                </Button>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                                <Lock size={300} />
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {/* Score Card */}
                        <Card className="col-span-1 border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#376497] to-[#0B8039]"></div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-slate-600 font-medium text-sm uppercase tracking-wider">Readiness Score</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-6">
                                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                                        <circle
                                            cx="50" cy="50" r="40"
                                            fill="transparent"
                                            stroke={score >= 80 ? '#10b981' : score >= 60 ? '#0d9488' : '#f97316'}
                                            strokeWidth="6"
                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-5xl font-display font-bold text-slate-900">{score}</span>
                                        <span className="text-xs font-semibold text-slate-400 uppercase mt-1">/ 100</span>
                                    </div>
                                </div>
                                <p className="text-center text-slate-500 text-sm">
                                    {score >= 80 ? "Excellent! You're ready." : score >= 60 ? "Good, but refine your answers." : "Keep practicing to develop your skills."}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Breakdown Card */}
                        <Card className="col-span-1 md:col-span-2 border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
                            <CardHeader>
                                <CardTitle className="text-xl font-display font-bold text-slate-800">Performance Breakdown</CardTitle>
                                <CardDescription>Analysis of answer quality across all questions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-700 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Strong Answers
                                        </span>
                                        <span className="text-slate-900">{strongCount}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(strongCount / session.questions.length) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-700 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-teal-500"></div> Good Answers
                                        </span>
                                        <span className="text-slate-900">{goodCount}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-teal-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(goodCount / session.questions.length) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-700 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Developing
                                        </span>
                                        <span className="text-slate-900">{practiceCount}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(practiceCount / session.questions.length) * 100}%` }}></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Analysis List */}
                    <div className="mb-8">
                        <h3 className="text-2xl font-display font-bold text-slate-900 mb-6">Detailed Question Review</h3>
                        <div className="space-y-4">
                            {session.questions.map((q, i) => {
                                const ans = session.answers[q.id];
                                const isExpanded = expandedQuestionId === q.id;

                                return (
                                    <Card key={q.id} id={`question-${q.id}`} className={cn("border-slate-200 transition-all duration-300", isExpanded ? "shadow-md ring-1 ring-blue-50 border-blue-200" : "hover:border-blue-200")}>
                                        <div
                                            onClick={() => toggleQuestion(q.id)}
                                            className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 cursor-pointer gap-4"
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={cn("shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mt-0.5",
                                                    ans?.analysis?.rating === 'Strong' ? 'bg-emerald-100 text-emerald-700' :
                                                        ans?.analysis?.rating === 'Good' ? 'bg-teal-100 text-teal-700' :
                                                            'bg-amber-100 text-amber-700'
                                                )}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 text-lg leading-snug">{q.text}</h4>
                                                    {!isExpanded && <p className="text-sm text-slate-400 mt-2 font-medium">Click to view full analysis</p>}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-6 pl-12 md:pl-0">
                                                <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider", getRatingColor(ans?.analysis?.rating))}>
                                                    {ans?.analysis?.rating || "Skipped"}
                                                </span>
                                                <ChevronRight className={cn("text-slate-400 transition-transform duration-300", isExpanded && "rotate-90")} size={20} />
                                            </div>
                                        </div>

                                        {isExpanded && ans?.analysis && (
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
                                                                {decodeHtml(ans.analysis.transcript)}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-6 mb-8">
                                                            {/* Feedback */}
                                                            {ans.analysis.feedback && (
                                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                                                <MessageSquare size={20} />
                                                                            </div>
                                                                            <h4 className="font-semibold text-slate-800">Feedback</h4>
                                                                        </div>
                                                                        <span className={cn("px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider", getRatingColor(ans.analysis.rating))}>
                                                                            {ans.analysis.rating}
                                                                        </span>
                                                                    </div>
                                                                    <ul className="space-y-4">
                                                                        {ans.analysis.feedback.map((point, i) => (
                                                                            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                                                <p className="text-slate-600 leading-relaxed">{point}</p>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* Speaking Delivery */}
                                                            {(ans.analysis.deliveryStatus || ans.analysis.deliveryTips) && (
                                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                                    <div className="flex items-center gap-3 mb-4">
                                                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                                            <Activity size={20} />
                                                                        </div>
                                                                        <h4 className="font-semibold text-slate-800">Speaking Delivery</h4>
                                                                        {ans.analysis.deliveryStatus && (
                                                                            <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                                                {ans.analysis.deliveryStatus}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {ans.analysis.deliveryTips && ans.analysis.deliveryTips.length > 0 && (
                                                                        <ul className="space-y-3">
                                                                            {ans.analysis.deliveryTips.map((tip, i) => (
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
                                                            {ans.analysis.keyTerms && ans.analysis.keyTerms.length > 0 && (
                                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                                    <div className="flex items-center gap-3 mb-4">
                                                                        <div className="p-2 bg-blue-50 rounded-lg text-[#376497]">
                                                                            <Award size={20} />
                                                                        </div>
                                                                        <h4 className="font-semibold text-slate-800">Key Professional Terms</h4>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {ans.analysis.keyTerms.map((term, i) => (
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
                                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                                                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                                                <Star size={18} className="text-[#376497] fill-current" />
                                                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Strong Response Example</h3>
                                                            </div>
                                                            <div className="p-6 md:p-8">
                                                                {ans.analysis.strongResponse ? (
                                                                    <p className="text-slate-700 leading-relaxed text-lg italic">
                                                                        "{ans.analysis.strongResponse}"
                                                                    </p>
                                                                ) : (
                                                                    <div className="flex flex-col items-center text-center p-4">
                                                                        <p className="text-slate-400 italic mb-2">Example response not available.</p>
                                                                        <p className="text-xs text-slate-300">Analysis may be incomplete.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Why This Works Section */}
                                                        {ans.analysis.whyThisWorks && (
                                                            <div className="animate-fade-in">
                                                                <div className="flex items-center gap-2 text-[#376497] mb-4">
                                                                    <CheckSquare size={20} className="stroke-[2.5]" />
                                                                    <h3 className="font-display font-bold text-slate-800 text-lg">Why This Works</h3>
                                                                </div>
                                                                <p className="text-slate-500 text-sm mb-6">Deep dive into the strategies used in the example above.</p>

                                                                <QuestionTips tips={ans.analysis.whyThisWorks} />
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
        </div>
    );
};

export default Summary;
