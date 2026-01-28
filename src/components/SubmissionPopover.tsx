import React from 'react';
import { Button } from './ui/button';
import { ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import { Question, CompetencyBlueprint } from '../types';
import { cn } from '../lib/utils';

interface SubmissionPopoverProps {
  isOpen: boolean;
  onFeedback: () => void;
  onNext: () => void;
  isSessionComplete?: boolean;
  onFinish?: () => void;
  onRetry?: () => void;
  question?: Question;
  questionIndex?: number;
  answer?: unknown;
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
}) => {
  if (!isOpen) return null;

  if (isSessionComplete) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md p-8 flex flex-col items-center gap-6 border border-slate-200 bg-white shadow-xl rounded-2xl animate-fade-in-up">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-rangam-navy font-display tracking-wide">
              Session Complete!
            </h3>
            <p className="text-slate-500 text-sm">
              Great job. Click Finish below to review your performance.
            </p>
          </div>
          <Button
            onClick={onFinish}
            className="w-full bg-rangam-blue hover:bg-rangam-blue/90 text-white shadow-md py-6 text-lg font-bold rounded-xl"
          >
            Finish & Review <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in md:pl-64">
      <div className="w-full max-w-md p-8 flex flex-col items-center gap-6 border border-slate-200 bg-white shadow-xl rounded-2xl animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
            <Activity size={32} className="text-rangam-blue" />
          </div>
          <h3 className="text-xl font-bold text-rangam-navy font-display tracking-wide">
            Answer Recorded
          </h3>
          <p className="text-slate-500 text-sm">
            Would you like to analyze this answer now or move on?
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={onFeedback}
            className="w-full py-6 rounded-xl bg-rangam-blue hover:bg-rangam-blue/90 text-white shadow-md transition-all font-bold text-sm uppercase tracking-wider border border-transparent"
          >
            View Analysis (Recommended)
          </Button>
          <Button
            variant="outline"
            onClick={onNext}
            className="w-full py-6 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm uppercase tracking-wider"
          >
            Back to Session
          </Button>
        </div>
      </div>
    </div>
  );
};
