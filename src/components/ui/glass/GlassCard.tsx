import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, children, hoverEffect = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={hoverEffect ? { scale: 1.02, boxShadow: "0 0 20px var(--glow-cyan)" } : {}}
                className={cn(
                    "glass-panel rounded-xl p-6 transition-all duration-300",
                    "hover:border-white/20",
                    className
                )}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...(props as any)}
            >
                {children}
            </motion.div>
        );
    }
);
GlassCard.displayName = "GlassCard";
