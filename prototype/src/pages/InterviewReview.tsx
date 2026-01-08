import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { cn } from '../lib/utils';
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
    Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Comprehensive Mock Data matching the real app's schema
const MOCK_SESSION_DATA = {
    role: "Senior React Developer",
    date: "Oct 24, 2023",
    score: 85,
    stats: {
        strong: 3,
        good: 2,
        developing: 1
    },
    questions: [
        {
            id: "q1",
            text: "Explain the difference between useMemo and useCallback in React.",
            rating: "Strong",
            transcript: "useMemo is used to memoize values, meaning it caches the result of a calculation so it doesn't have to be recomputed on every render unless dependencies change. useCallback, on the other hand, is specifically for memoizing functions. It returns a memoized version of the callback function that only changes if one of the dependencies has changed. This is really useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders.",
            feedback: [
                "Excellent distinction between value memoization and function memoization.",
                "Correctly identified the use case for preventing unnecessary child re-renders.",
                "Clear and concise explanation."
            ],
            deliveryStatus: "Confident",
            deliveryTips: [
                "Your pacing was steady and easy to follow.",
                "Good use of emphasis on key terms."
            ],
            keyTerms: ["memoization", "dependencies", "reference equality", "re-renders"],
            strongResponse: "useMemo memoizes the result of a computation, caching the value to avoid expensive recalculations. useCallback memoizes the function definition itself, ensuring the function reference remains stable between renders. You typically use useMemo for expensive calculations and useCallback when passing functions to child components wrapped in React.memo to prevent unnecessary re-renders due to reference changes.",
            whyThisWorks: [
                "Directly compares the primary purpose of each hook.",
                "Mentions the specific mechanism (caching value vs. stable function reference).",
                "Provides the canonical use case for each (expensive calc vs. child props)."
            ]
        },
        {
            id: "q2",
            text: "How would you handle global state management in a large application?",
            rating: "Good",
            transcript: "For a large app, I'd probably use Context API for simpler things like themes or user auth. But for more complex data that changes often, I might look at Redux or maybe Zustand. Redux is great but has boilerplate. Zustand is smaller. Context can have performance issues if you're not careful with provider nesting.",
            feedback: [
                "Good acknowledgment of different tools for different scales (Context vs. Redux).",
                "Correctly noted the potential performance pitfall of Context API.",
                "Could have elaborated more on *why* Redux is chosen for complex state (middleware, debugging)."
            ],
            deliveryStatus: "Neutral",
            deliveryTips: [
                "You used a few filler words like 'probably' and 'maybe'. Try to sound more decisive.",
                "Volume dropped slightly at the end of the sentence."
            ],
            keyTerms: ["Context API", "Redux", "Zustand", "Boilerplate", "Provider Nesting"],
            strongResponse: "For a large-scale application, I prefer a hybrid approach. I use React Context for low-frequency updates like theme or user authentication. For high-frequency, complex application state, I implement a dedicated library like Redux Toolkit or Zustand. These libraries provide better performance optimization through selectors, avoiding the unnecessary re-renders that can occur with raw Context, and offer powerful developer tools for debugging state changes.",
            whyThisWorks: [
                "Proposes a sophisticated 'hybrid' architecture.",
                "Clearly distinguishes between low-frequency and high-frequency state updates.",
                "Highlights specific technical benefits (selectors, dev tools) rather than just personal preference."
            ]
        },
        {
            id: "q3",
            text: "Describe a time you had a conflict with a team member.",
            rating: "Developing",
            transcript: "Yeah, so there was this one time a designer kept changing the requirements. It was really annoying. I told them we couldn't keep doing that because the deadline was coming up. Eventually, we just sort of compromised, but it made the code messy.",
            feedback: [
                "The tone comes across as complaining rather than professional.",
                "Lacks a clear 'Resolution' phase—how specifically did you compromise?",
                "Missed an opportunity to show leadership or empathy."
            ],
            deliveryStatus: "Tense",
            deliveryTips: [
                "Your tone sounded frustrated. Keep it objective.",
                "Try to use the STAR method (Situation, Task, Action, Result) to structure the story."
            ],
            keyTerms: ["Requirements", "Deadline", "Compromise"],
            strongResponse: "In a previous project, a designer proposed late-stage changes that jeopardized our sprint deadline. I scheduled a quick sync to explain the technical debt and risk associated with the changes. We agreed to a phased approach: implementing the critical UI fixes immediately while pushing the complex interactions to the next sprint. This maintained our delivery schedule while validating their design concerns, leading to a smoother collaboration on future sprints.",
            whyThisWorks: [
                "Follows the STAR method perfectly.",
                "Focuses on the solution and process, not the emotion.",
                "Demonstrates positive conflict resolution and long-term relationship building."
            ]
        }
    ]
};

export const InterviewReview = () => {
    const navigate = useNavigate();
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]";
        if (score >= 60) return "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]";
        return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]";
    };

    const getRatingBadge = (rating: string) => {
        switch (rating) {
            case 'Strong': return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
            case 'Good': return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
            default: return "bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
        }
    };

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                        Session Analysis
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Insights for <span className="text-cyan-400 font-medium">{MOCK_SESSION_DATA.role}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <GlassButton variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2 size={16} /> Share
                    </GlassButton>
                    <GlassButton variant="outline" size="sm" className="flex items-center gap-2">
                        <Download size={16} /> Export
                    </GlassButton>
                    <GlassButton onClick={() => navigate('/dashboard')}>Back to Dashboard</GlassButton>
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
                                strokeDashoffset={2 * Math.PI * 70 * (1 - MOCK_SESSION_DATA.score / 100)}
                                strokeLinecap="round"
                                className={cn("transition-all duration-1000 ease-out", getScoreColor(MOCK_SESSION_DATA.score).split(' ')[0])} // Use just the color class for stroke
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-5xl font-bold", getScoreColor(MOCK_SESSION_DATA.score))}>
                                {MOCK_SESSION_DATA.score}
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
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Strong Answers
                                </span>
                                <span className="text-white font-mono">{MOCK_SESSION_DATA.stats.strong}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(MOCK_SESSION_DATA.stats.strong / MOCK_SESSION_DATA.questions.length) * 100}%` }}
                                    className="h-full bg-emerald-500 rounded-full box-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Good Answers
                                </span>
                                <span className="text-white font-mono">{MOCK_SESSION_DATA.stats.good}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(MOCK_SESSION_DATA.stats.good / MOCK_SESSION_DATA.questions.length) * 100}%` }}
                                    className="h-full bg-cyan-500 rounded-full box-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" /> Developing
                                </span>
                                <span className="text-white font-mono">{MOCK_SESSION_DATA.stats.developing}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(MOCK_SESSION_DATA.stats.developing / MOCK_SESSION_DATA.questions.length) * 100}%` }}
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
                    {MOCK_SESSION_DATA.questions.map((q, i) => {
                        const isExpanded = expandedIds.includes(q.id);
                        return (
                            <GlassCard
                                key={q.id}
                                className={cn(
                                    "transition-all duration-300 border-l-4",
                                    q.rating === 'Strong' ? 'border-l-emerald-500' :
                                        q.rating === 'Good' ? 'border-l-cyan-500' :
                                            'border-l-amber-500'
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
                                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", getRatingBadge(q.rating))}>
                                            {q.rating}
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
                                                {/* Left Column: Analysis */}
                                                <div className="space-y-6">
                                                    {/* Transcript */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <Mic size={14} className="text-cyan-400" /> Your Answer
                                                        </h4>
                                                        <div className="p-4 rounded-xl bg-black/20 text-gray-200 italic leading-relaxed border border-white/5">
                                                            "{q.transcript}"
                                                        </div>
                                                    </div>

                                                    {/* Feedback Points */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <MessageSquare size={14} className="text-emerald-400" /> Feedback
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {q.feedback.map((point, idx) => (
                                                                <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                                                    <CheckCircle2 className="text-emerald-400 w-5 h-5 shrink-0 mt-0.5" />
                                                                    <span className="text-gray-300 text-sm">{point}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Key Terms */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <Award size={14} className="text-purple-400" /> Key Terms Used
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.keyTerms.map((term, tIdx) => (
                                                                <span key={tIdx} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md text-xs font-medium">
                                                                    {term}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: AI Guidance */}
                                                <div className="space-y-6">
                                                    {/* Strong Response */}
                                                    <div className="bg-linear-to-br from-amber-500/10 to-transparent p-1 rounded-2xl border border-amber-500/20">
                                                        <div className="bg-black/40 rounded-xl p-6 h-full">
                                                            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                                                <Star size={14} className="fill-amber-400 text-amber-400" /> Strong Response Example
                                                            </h4>
                                                            <p className="text-gray-200 leading-relaxed">
                                                                {q.strongResponse}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Why It Works */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <Lightbulb size={14} className="text-yellow-400" /> Why This Works
                                                        </h4>
                                                        <div className="grid gap-3">
                                                            {q.whyThisWorks.map((tip, tipIdx) => (
                                                                <div key={tipIdx} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                                                                    <span className="text-gray-300 text-sm">{tip}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Delivery Tips */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                            <Activity size={14} className="text-blue-400" /> Delivery Notes
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            <span className="px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-xs font-bold uppercase">
                                                                {q.deliveryStatus}
                                                            </span>
                                                        </div>
                                                        <ul className="space-y-2 text-sm text-gray-400">
                                                            {q.deliveryTips.map((tip, dIdx) => (
                                                                <li key={dIdx} className="flex gap-2">
                                                                    <span className="text-blue-500">•</span> {tip}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
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
