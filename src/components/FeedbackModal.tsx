import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { ReviewQuestionItem } from './ui/glass/ReviewQuestionItem';
import { Question, AnalysisResult, CompetencyBlueprint } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  answer: {
    text?: string;
    audioBlob?: Blob;
    analysis: AnalysisResult | null;
  };
  questionIndex: number;
  blueprint?: CompetencyBlueprint;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  question,
  answer,
  questionIndex,
  blueprint,
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-64 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto custom-scrollbar relative bg-transparent rounded-2xl">
        {/* Header Controls: Copy & Close */}
        <div className="sticky top-0 right-0 z-50 flex justify-end gap-2 px-6 py-6 md:px-8 md:py-8 pointer-events-none">
          {/* Copy Button */}
          <button
            className={cn(
              'pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border text-xs font-medium backdrop-blur-sm shadow-lg',
              isCopied
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-black/50 text-gray-400 hover:text-white hover:bg-white/10 border-white/10'
            )}
            title="Copy Answer"
            aria-label="Copy Answer"
            disabled={isCopied}
            onClick={() => {
              if (answer.text) {
                navigator.clipboard.writeText(answer.text);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }
            }}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            {isCopied ? 'Copied!' : 'Copy Answer'}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
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
              audioBlob: answer.audioBlob,
            }}
            index={questionIndex}
            isExpanded={true}
            onToggle={() => {}}
            hideExpandIcon={true}
            className="pt-24 md:pt-32 min-h-[500px]"
            blueprint={blueprint}
          />
        </div>
      </div>
    </div>
  );
};
