import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: "bg-linear-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none",
            outline: "bg-transparent border border-white/20 hover:bg-white/5 text-white",
            ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white border-none",
        };

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-10 px-6 text-sm",
            lg: "h-12 px-8 text-base",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
                    variants[variant],
                    sizes[size],
                    className
                )}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...(props as any)}
            />
        );
    }
);
GlassButton.displayName = "GlassButton";
