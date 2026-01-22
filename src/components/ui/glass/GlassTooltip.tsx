import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface GlassTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content,
  children,
  side = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-2',
    bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full mt-2',
    left: '-left-2 top-1/2 -translate-y-1/2 -translate-x-full mr-2',
    right: '-right-2 top-1/2 -translate-y-1/2 translate-x-full ml-2',
  };

  return (
    <div
      className={cn('relative flex items-center', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-3 py-2 text-xs font-medium text-white bg-zinc-900/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-md whitespace-nowrap min-w-max max-w-[300px] pointer-events-none',
              positionClasses[side]
            )}
            style={{ whiteSpace: 'normal', textAlign: 'center' }}
          >
            {content}
            {/* Arrow logic could go here but skipping for clean minimalist look */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
