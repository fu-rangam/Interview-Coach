import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassSelectProps {
    className?: string;
    label?: string;
    error?: string;
    options: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const GlassSelect = React.forwardRef<HTMLDivElement, GlassSelectProps>(
    ({ className, label, error, options, placeholder, value, onChange, disabled }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const containerRef = useRef<HTMLDivElement>(null);

        const selectedOption = options.find(opt => opt.value === value);

        // Click outside to close
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const handleSelect = (optionValue: string) => {
            onChange(optionValue);
            setIsOpen(false);
        };

        return (
            <div className="space-y-2 w-full" ref={containerRef}>
                {label && (
                    <label className="block text-sm font-medium text-gray-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {/* Trigger Button */}
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        disabled={disabled}
                        className={cn(
                            "w-full text-left appearance-none bg-black/40 border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-white transition-colors cursor-pointer flex items-center justify-between",
                            "hover:border-white/20",
                            "focus:outline-none focus:border-cyan-500/50",
                            disabled && "opacity-50 cursor-not-allowed",
                            isOpen && "border-cyan-500/50 bg-black/60",
                            error && "border-red-500/50",
                            className
                        )}
                    >
                        <span className={cn("block truncate", !selectedOption && "text-gray-400")}>
                            {selectedOption ? selectedOption.label : (placeholder || "Select...")}
                        </span>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                            <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute z-50 w-full mt-1 overflow-hidden bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                            >
                                <ul className="py-1">
                                    {options.filter(opt => opt.value !== "").map((opt) => { // Filter out empty placeholder options if they exist in valid options
                                        const isSelected = opt.value === value;
                                        return (
                                            <li key={opt.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelect(opt.value)}
                                                    disabled={opt.disabled}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group",
                                                        isSelected ? "bg-cyan-500/10 text-cyan-400" : "text-gray-300 hover:bg-white/5 hover:text-white",
                                                        opt.disabled && "opacity-50 cursor-not-allowed"
                                                    )}
                                                >
                                                    <span className="truncate">{opt.label}</span>
                                                    {isSelected && <Check size={14} className="text-cyan-400" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);

GlassSelect.displayName = "GlassSelect";
