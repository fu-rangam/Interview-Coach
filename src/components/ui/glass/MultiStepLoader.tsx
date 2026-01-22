import { cn } from '../../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn('w-6 h-6', className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-6 h-6', className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex relative justify-center flex-col w-full max-w-xs mx-auto">
      {loadingStates.map((loadingState, index) => {
        const isCompleted = index < value;
        const isCurrent = index === value;
        const isFuture = index > value;

        return (
          <motion.div
            key={index}
            className={cn('text-left flex gap-3 mb-4 items-center last:mb-0')}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: isFuture ? 0.4 : 1,
              x: 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="shrink-0">
              {isFuture && <CheckIcon className="text-white/20" />}
              {isCurrent && <CheckFilled className="text-cyan-400 animate-pulse" />}
              {isCompleted && <CheckFilled className="text-emerald-500" />}
            </div>
            <span
              className={cn(
                'text-lg transition-colors duration-300 font-medium',
                isFuture && 'text-gray-500',
                isCurrent && 'text-cyan-400',
                isCompleted && 'text-emerald-400'
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
  onComplete,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  onComplete?: () => void;
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) => {
        const nextState = loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1);

        return nextState;
      });
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);

  useEffect(() => {
    if (!loop && currentState === loadingStates.length - 1 && loading) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // Small buffer to let animation finish
      return () => clearTimeout(timer);
    }
  }, [currentState, loading, loop, loadingStates.length, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 md:pl-64 bg-black/80 backdrop-blur-md"
        >
          {/* Matches SubmissionPopover container style */}
          <GlassCard className="min-h-[384px] relative w-full max-w-md bg-zinc-900/90 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Decorative Glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full px-4">
              <LoaderCore value={currentState} loadingStates={loadingStates} />
            </div>

            {/* Bottom Cyan Bar (Progress indicator) */}
            <div className="bg-linear-to-t from-cyan-900/20 via-transparent to-transparent absolute bottom-0 inset-x-0 h-20 w-full z-0 pointer-events-none" />
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
