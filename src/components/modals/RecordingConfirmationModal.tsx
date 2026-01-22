import React from 'react';
import { GlassCard } from '../ui/glass/GlassCard';
import { GlassButton } from '../ui/glass/GlassButton';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in md:pl-64">
      <GlassCard className="w-full max-w-md p-8 flex flex-col items-center gap-6 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-white font-display tracking-wide">
            Recording Complete
          </h3>
          <p className="text-gray-400 text-sm">
            Would you like to submit this answer or try again?
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium text-sm uppercase tracking-wider"
          >
            Retry
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all font-bold text-sm uppercase tracking-wider border border-white/10"
          >
            Submit
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
