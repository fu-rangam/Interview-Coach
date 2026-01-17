import React, { useState } from 'react';
import { GlassCard } from './ui/glass/GlassCard';
import { GlassButton } from './ui/glass/GlassButton';
import { RefreshCcw, ArrowRight, Activity, Save, X, Copy, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReviewQuestionItem } from './ui/glass/ReviewQuestionItem';
import { Question, AnalysisResult, CompetencyBlueprint } from '../types';

interface SubmissionPopoverProps {
    isOpen: boolean;
    onRetry: () => void;
    onFeedback: () => void;
    onNext: () => void;
    isSessionComplete?: boolean;
    onFinish?: () => void;
    question?: Question;
    questionIndex?: number;
    answer?: {
        text?: string;
        audioBlob?: Blob;
        analysis: AnalysisResult | null;
    };
    blueprint?: CompetencyBlueprint;
    hasSkippedQuestions?: boolean;
}

export const SubmissionPopover: React.FC<SubmissionPopoverProps> = ({
    isOpen,
    onRetry,
    onFeedback,
    onNext,
    isSessionComplete = false,
    onFinish,
    question,
    questionIndex = 0,
    answer,
    blueprint,
    hasSkippedQuestions = false
}) => {
    const [showFeedback, setShowFeedback] = useState(false);

    if (!isOpen) return null;

    // Feedback Modal Overlay
    if (showFeedback && question && answer) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-64 bg-black/80 backdrop-blur-md animate-fade-in">
                <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto custom-scrollbar relative bg-transparent rounded-2xl">
                    {/* Header Controls: Copy & Close */}
                    <div className="sticky top-0 right-0 z-50 flex justify-end gap-2 px-6 py-6 md:px-8 md:py-8 pointer-events-none">
                        {/* Copy Button */}
                        <button
                            className="pointer-events-auto p-2 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-sm shadow-lg"
                            title="Copy Answer"
                        >
                            <Copy size={20} />
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowFeedback(false)}
                            className="pointer-events-auto p-2 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-sm shadow-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-1 md:px-4 pb-8 -mt-24 md:-mt-32">
                        <ReviewQuestionItem
                            q={{
                                ...question,
                                analysis: answer.analysis,
                                transcript: answer.text,
                                audioBlob: answer.audioBlob
                            }}
                            index={questionIndex}
                            isExpanded={true}
                            onToggle={() => { }}
                            hideExpandIcon={true}
                            className="pt-24 md:pt-32 min-h-[500px]"
                            blueprint={blueprint}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:pl-64 bg-black/80 backdrop-blur-md animate-fade-in">
            <GlassCard className="min-h-[384px] w-full max-w-md bg-zinc-900/90 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center gap-6 p-8 relative overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center space-y-2 relative z-10 w-full animate-fade-in-up">
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-cyan-100 font-display">
                        "{answer?.analysis?.coachReaction || "Got It!"}"
                    </h3>
                    <p className="text-cyan-300/80 text-sm font-medium tracking-wide">
                        What would you like to do next?
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 relative z-10 w-full">
                    <GlassButton
                        onClick={isSessionComplete && onFinish ? onFinish : onNext}
                        className={cn(
                            "w-full h-14 text-base text-white border-none shadow-lg font-semibold",
                            isSessionComplete
                                ? "bg-linear-to-r from-emerald-600 to-emerald-500 hover:to-emerald-400 shadow-emerald-900/20"
                                : hasSkippedQuestions
                                    ? "bg-linear-to-r from-cyan-600 to-cyan-500 hover:to-cyan-400 shadow-cyan-900/20"
                                    : "bg-linear-to-r from-cyan-600 to-cyan-500 hover:to-cyan-400 shadow-cyan-900/20"
                        )}
                    >
                        {isSessionComplete ? (
                            <>
                                <Save size={18} className="mr-2" />
                                Save & Review Session
                            </>
                        ) : hasSkippedQuestions ? (
                            <>
                                <List size={18} className="mr-2" />
                                Select Another Question
                            </>
                        ) : (
                            <>
                                <ArrowRight size={18} className="mr-2" />
                                Go To Next Question
                            </>
                        )}
                    </GlassButton>

                    {answer?.analysis && (
                        <button
                            onClick={() => setShowFeedback(true)}
                            className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-cyan-300 text-base font-semibold transition-all flex items-center justify-center gap-2 group"
                        >
                            <Activity size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                            See Coach's Feedback
                        </button>
                    )}

                    <button
                        onClick={onRetry}
                        className="w-full h-14 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-base font-semibold flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={18} />
                        Discard & Try Again
                    </button>

                </div>
            </GlassCard>
        </div>
    );
};
