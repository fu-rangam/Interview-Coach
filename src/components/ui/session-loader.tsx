import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionLoaderProps {
  isLoading: boolean;
  onTransitionComplete: () => void;
}

export const SessionLoader: React.FC<SessionLoaderProps> = ({
  isLoading,
  onTransitionComplete,
}) => {
  const [stage, setStage] = useState<'waiting' | 'entering' | 'complete'>('waiting');

  // Effect 1: When loading is done, add brief delay then show "Entering Interview Room"
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isLoading && stage === 'waiting') {
      // Brief delay to let React settle, smoother animation
      timeout = setTimeout(() => {
        setStage('entering');
      }, 100);
    }

    return () => clearTimeout(timeout);
  }, [isLoading, stage]);

  // Effect 2: Show "Entering Interview Room" for 1s, then complete
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (stage === 'entering') {
      timeout = setTimeout(() => {
        setStage('complete');
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [stage]);

  // Effect 3: Handle Completion & Unmount
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (stage === 'complete') {
      // Wait for exit animation to finish
      timeout = setTimeout(() => {
        onTransitionComplete();
      }, 500);
    }
    return () => clearTimeout(timeout);
  }, [stage, onTransitionComplete]);

  return (
    <AnimatePresence>
      {stage !== 'complete' && (
        <motion.div
          key="loader-overlay"
          className="fixed inset-0 z-100 flex flex-col items-center justify-center backdrop-blur-md bg-white/90 overflow-hidden md:pl-64"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        >
          <div className="relative flex flex-col items-center">
            <motion.div
              key="entering"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.3 } }}
              className="flex flex-col items-center"
            >
              <h2 className="text-xl md:text-2xl font-light tracking-widest text-rangam-navy uppercase font-display select-none">
                Entering Interview Room...
              </h2>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
