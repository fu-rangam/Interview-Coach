import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    label?: string;
    error?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, icon, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                            {icon}
                        </div>
                    )}
                    <motion.input
                        ref={ref}
                        whileFocus={{ scale: 1.01 }}
                        className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none transition-all duration-300",
                            "focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_10px_rgba(6,182,212,0.1)]",
                            icon && "pl-10",
                            error && "border-red-500/50 focus:border-red-500",
                            className
                        )}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        {...(props as any)}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>
                )}
            </div>
        );
    }
);
GlassInput.displayName = "GlassInput";
