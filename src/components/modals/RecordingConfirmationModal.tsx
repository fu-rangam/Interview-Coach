import React from 'react';
import { Button } from '../ui/button';

interface RecordingConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onRetry: () => void;
}

export const RecordingConfirmationModal: React.FC<RecordingConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in md:pl-64">
      <div className="w-full max-w-md p-8 flex flex-col items-center gap-6 border border-slate-200 bg-white shadow-xl rounded-2xl animate-fade-in-up">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-rangam-navy font-display tracking-wide">
            Recording Complete
          </h3>
          <p className="text-slate-500 text-sm">
            Would you like to submit this answer or try again?
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex-1 py-6 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm uppercase tracking-wider"
          >
            Retry
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 py-6 rounded-xl bg-rangam-blue hover:bg-rangam-blue/90 text-white shadow-md transition-all font-bold text-sm uppercase tracking-wider border border-transparent"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};
