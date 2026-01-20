import React from 'react';
import { cn } from '../../../lib/utils';

interface GlassRadioOption {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
}

interface GlassRadioGroupProps {
    options: GlassRadioOption[];
    value: string;
    onChange: (value: string) => void;
    name?: string;
    className?: string;
    columns?: 1 | 2 | 'auto';  // 'auto' = 2 columns if >3 options
}

export const GlassRadioGroup: React.FC<GlassRadioGroupProps> = ({
    options,
    value,
    onChange,
    name = 'radio-group',
    className,
    columns = 'auto'
}) => {
    // Determine column count
    const colCount = columns === 'auto'
        ? (options.length > 3 ? 2 : 1)
        : columns;

    return (
        <div
            className={cn(
                "grid gap-3",
                colCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
                className
            )}
        >
            {options.map((option) => {
                const isSelected = option.value === value;
                return (
                    <label
                        key={option.value}
                        className={cn(
                            "relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all h-full",
                            "border",
                            isSelected
                                ? "bg-cyan-500/10 border-cyan-500/50 text-white"
                                : "bg-black/20 border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20",
                            option.disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={isSelected}
                            onChange={() => !option.disabled && onChange(option.value)}
                            disabled={option.disabled}
                            className="sr-only"
                        />
                        {/* Custom Radio Circle */}
                        <div
                            className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                "mt-0.5", // Align with top of text if wrapping
                                isSelected
                                    ? "border-cyan-500 bg-cyan-500"
                                    : "border-gray-500"
                            )}
                        >
                            {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                        </div>
                        {/* Label */}
                        <span className={cn(
                            "text-sm font-medium flex-1", // FLEX-1 for wrapping
                            isSelected && "text-cyan-400"
                        )}>
                            {option.label}
                        </span>
                    </label>
                );
            })}
        </div>
    );
};
