import React from 'react';
import { cn } from '../../../lib/utils';


interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-all duration-300 min-h-[120px]",
                        "focus:border-cyan-500/50 focus:bg-white/10 focus:shadow-[0_0_10px_rgba(6,182,212,0.1)] focus:scale-[1.01]",
                        error && "border-red-500/50 focus:border-red-500",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>
                )}
            </div>
        );
    }
);
GlassTextarea.displayName = "GlassTextarea";
