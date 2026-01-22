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
    onClose?: () => void;
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
    inline?: boolean;
}

export const SubmissionPopover: React.FC<SubmissionPopoverProps> = ({
    isOpen,
    onRetry,
    onFeedback,
    onNext,
    onClose,
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

    // Feedback Modal Overlay (Keep fixed overlay for the modal itself)
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
                            aria-label="Copy Answer"
                        >
                            <Copy size={20} />
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowFeedback(false)}
                            className="pointer-events-auto p-2 rounded-full bg-black/50 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/10 backdrop-blur-sm shadow-lg"
                            aria-label="Close"
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

    // If session complete, show special state (Text only, transparent inline)
    if (isSessionComplete) {
        return (
            <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-white">Session Complete!</h3>
                    <p className="text-gray-400 text-sm">Great job. Click Finish below to review.</p>
                </div>
            </div>
        );
    }

    // Standard View Answer Analysis (Text + Buttons, transparent inline)
    return (
        <div className="flex flex-col items-center gap-4 animate-fade-in pointer-events-none">
            <h3 className="text-lg font-medium text-white text-center">
                View Answer Analysis?
            </h3>

            <div className="flex gap-3">
                {/* After (Close) */}
                <button
                    onClick={onNext} // Uses onNext prop passed as closing handler
                    className="pointer-events-auto px-6 py-2.5 rounded-lg border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-all text-sm"
                >
                    After the Interview
                </button>

                {/* Now (Feedback) */}
                <button
                    onClick={onFeedback}
                    className="pointer-events-auto px-6 py-2.5 rounded-lg border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/10 hover:border-cyan-400 transition-all text-sm"
                >
                    Now
                </button>
            </div>
        </div>
    );
};
