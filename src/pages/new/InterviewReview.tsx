import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../../components/ui/glass/GlassCard';
import { GlassButton } from '../../components/ui/glass/GlassButton';
import { cn } from '../../lib/utils';
import {
    CheckCircle2,
    MessageSquare,
    Mic,
    Share2,
    Download,
    Award,
    Activity,
    Star,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Target,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '../../hooks/useSessionContext';
import { AnalysisResult } from '../../types';

export const InterviewReview: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useSessionContext();
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Derived State: Calculate Scores & Stats
    const { score, stats, questionsWithAnalysis } = useMemo(() => {
        const questions = session.questions;
        const answers = session.answers || {};

        let totalScore = 0;
        let count = 0;
        const stats = { strong: 0, good: 0, developing: 0 };

        const questionsWithAnalysis = questions.map(q => {
            const result = answers[q.id]?.analysis;
            let qScore = 0;

            if (result?.rating === 'Strong') { qScore = 100; stats.strong++; }
            else if (result?.rating === 'Good') { qScore = 80; stats.good++; }
            else if (result?.rating === 'Developing') { qScore = 60; stats.developing++; }
            else { qScore = 0; } // Pending or unknown

            if (result) {
                totalScore += qScore;
                count++;
            }

            return {
                ...q,
                analysis: result,
                transcript: answers[q.id]?.text || "No transcript available.",
            };
        });

        const finalScore = count > 0 ? Math.round(totalScore / count) : 0;
        return { score: finalScore, stats, questionsWithAnalysis };
    }, [session]);


    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]";
        if (score >= 60) return "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]";
        return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]";
    };

    const getRatingBadge = (rating?: string) => {
        switch (rating) {
            case 'Strong': return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
            case 'Good': return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
            case 'Developing': return "bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
            default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    if (!session.questions.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white">
                <p className="mb-4">No session data found.</p>
                <GlassButton onClick={() => navigate('/glass/dashboard')}>Go Dashboard</GlassButton>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                        Session Analysis
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Insights for <span className="text-cyan-400 font-medium">{session.role}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <GlassButton variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2 size={16} /> Share
                    </GlassButton>
                    <GlassButton variant="outline" size="sm" className="flex items-center gap-2">
                        <Download size={16} /> Export
                    </GlassButton>
                    <GlassButton onClick={() => navigate('/glass/dashboard')}>Back to Dashboard</GlassButton>
                </div>
            </div>

            {/* Score & Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Score */}
                <GlassCard className="flex flex-col items-center justify-center py-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">Overall Confidence</h3>
                    <div className="relative">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle
                                cx="80" cy="80" r="70"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 70}
                                strokeDashoffset={2 * Math.PI * 70 * (1 - score / 100)}
                                strokeLinecap="round"
                                className={cn("transition-all duration-1000 ease-out", getScoreColor(score).split(' ')[0])}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-5xl font-bold", getScoreColor(score))}>
                                {score}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">/ 100</span>
                        </div>
                    </div>
                </GlassCard>

                {/* Performance Breakdown */}
                <GlassCard className="col-span-1 md:col-span-2 flex flex-col justify-center p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="text-cyan-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Performance Breakdown</h3>
                    </div>
                    <div className="space-y-6">
                        {/* Strong */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Strong Answers
                                </span>
                                <span className="text-white font-mono">{stats.strong}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${session.questions.length ? (stats.strong / session.questions.length) * 100 : 0}%` }}
                                    className="h-full bg-emerald-500 rounded-full box-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                        </div>
                        {/* Good */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Good Answers
                                </span>
                                <span className="text-white font-mono">{stats.good}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${session.questions.length ? (stats.good / session.questions.length) * 100 : 0}%` }}
                                    className="h-full bg-cyan-500 rounded-full box-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                />
                            </div>
                        </div>
                        {/* Developing */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> Developing
                                </span>
                                <span className="text-white font-mono">{stats.developing}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${session.questions.length ? (stats.developing / session.questions.length) * 100 : 0}%` }}
                                    className="h-full bg-amber-500 rounded-full box-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Detailed Questions List */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="text-purple-400" /> Detailed Review
                </h2>
                <div className="space-y-4">
                    {questionsWithAnalysis.map((q, i) => {
                        const isExpanded = expandedIds.includes(q.id);
                        const rating = q.analysis?.rating;

                        return (
                            <GlassCard
                                key={q.id}
                                className={cn(
                                    "transition-all duration-300 border-l-4",
                                    rating === 'Strong' ? 'border-l-emerald-500' :
                                        rating === 'Good' ? 'border-l-cyan-500' :
                                            rating === 'Developing' ? 'border-l-amber-500' : 'border-l-gray-500'
                                )}
                            >
                                {/* Summary Row (Clickable) */}
                                <div
                                    onClick={() => toggleExpand(q.id)}
                                    className="p-6 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-1">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                                {q.text}
                                            </h3>
                                            {!isExpanded && (
                                                <p className="text-sm text-gray-500 mt-1">Click to reveal detailed feedback...</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 self-end md:self-auto pl-12 md:pl-0">
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", getRatingBadge(rating))}>
                                            {rating || "Pending"}
                                        </span>
                                        {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-white/10"
                                        >
                                            <div className="p-6 pt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Analysis Column */}
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <Mic size={14} className="text-cyan-400" /> Your Answer
                                                        </h4>
                                                        <div className="p-4 rounded-xl bg-black/20 text-gray-200 italic leading-relaxed border border-white/5">
                                                            "{q.transcript}"
                                                        </div>
                                                    </div>

                                                    {q.analysis && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                                <MessageSquare size={14} className="text-emerald-400" /> Feedback
                                                            </h4>
                                                            <ul className="space-y-3">
                                                                {q.analysis.feedback?.map((point, idx) => (
                                                                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                                                        <CheckCircle2 className="text-emerald-400 w-5 h-5 shrink-0 mt-0.5" />
                                                                        <span className="text-gray-300 text-sm">{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* AI Guidance Column */}
                                                <div className="space-y-6">
                                                    {q.analysis?.strongResponse && (
                                                        <div className="bg-linear-to-br from-amber-500/10 to-transparent p-1 rounded-2xl border border-amber-500/20">
                                                            <div className="bg-black/40 rounded-xl p-6 h-full">
                                                                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                                                    <Star size={14} className="fill-amber-400 text-amber-400" /> Strong Response Example
                                                                </h4>
                                                                <p className="text-gray-200 leading-relaxed">
                                                                    {q.analysis.strongResponse}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Placeholder if no analysis */}
                                                    {!q.analysis && (
                                                        <div className="flex flex-col items-center justify-center h-full p-8 border border-white/10 rounded-xl bg-white/5">
                                                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                                                            <p className="text-gray-400 text-center">AI Analysis is processing...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </GlassCard>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
