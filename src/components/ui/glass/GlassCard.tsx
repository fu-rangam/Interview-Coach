import React from 'react';
import { cn } from '../../../lib/utils';


interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, children, hoverEffect = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "glass-panel rounded-xl p-6 transition-all duration-300 animate-fade-in-up",
                    hoverEffect && "hover:scale-[1.02] hover:shadow-glow-cyan/50",
                    "hover:border-white/20",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
GlassCard.displayName = "GlassCard";
