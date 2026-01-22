import React from 'react';
import { GlassCard } from './ui/glass/GlassCard';
import { GlassButton } from './ui/glass/GlassButton';
import { ArrowRight, Activity } from 'lucide-react';
import { Question, CompetencyBlueprint } from '../types';

interface SubmissionPopoverProps {
    isOpen: boolean;
    onFeedback: () => void;
    onNext: () => void;
    isSessionComplete?: boolean;
    onFinish?: () => void;
    onRetry?: () => void;
    question?: Question;
    questionIndex?: number;
    answer?: any;
    blueprint?: CompetencyBlueprint;
    hasSkippedQuestions?: boolean;
    onClose?: () => void;
    inline?: boolean;
}

export const SubmissionPopover: React.FC<SubmissionPopoverProps> = ({
    isOpen,
    onFeedback,
    onNext,
    isSessionComplete = false,
    onFinish,
    onRetry,
    question,
    questionIndex,
    answer,
    blueprint,
    hasSkippedQuestions,
    onClose,
    inline,
}) => {
    if (!isOpen) return null;

    if (isSessionComplete) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                <GlassCard className="w-full max-w-md p-8 flex flex-col items-center gap-6 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-white font-display tracking-wide">
                            Session Complete!
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Great job. Click Finish below to review your performance.
                        </p>
                    </div>
                    <GlassButton
                        onClick={onFinish}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/10"
                    >
                        Finish & Review <ArrowRight size={16} className="ml-2" />
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in md:pl-64">
            <GlassCard className="w-full max-w-md p-8 flex flex-col items-center gap-6 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                        <Activity size={32} className="text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-display tracking-wide">
                        Answer Recorded
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Would you like to analyze this answer now or move on?
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onFeedback}
                        className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all font-bold text-sm uppercase tracking-wider border border-white/10"
                    >
                        View Analysis (Recommended)
                    </button>
                    <button
                        onClick={onNext}
                        className="w-full py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium text-sm uppercase tracking-wider"
                    >
                        Back to Session
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
