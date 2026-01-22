import React from 'react';
import { cn } from '../../../lib/utils';


interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: "bg-linear-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-400 hover:to-blue-500 text-white shadow-glow-cyan border-none",
            default: "bg-zinc-800/50 hover:bg-zinc-700/50 text-gray-200 border border-white/10 shadow-elevation-1",
            outline: "bg-transparent border border-white/20 hover:bg-white/5 text-white shadow-none",
            ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white border-none shadow-none",
            destructive: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 hover:border-red-500/80 shadow-glow-red",
        };

        const sizes = {
            sm: "h-8 px-4 text-xs",
            md: "h-10 px-6 text-sm",
            lg: "h-12 px-8 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-95 hover:scale-[1.02]",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
GlassButton.displayName = "GlassButton";
