import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/glass/GlassCard';
import { GlassButton } from './ui/glass/GlassButton';
import { ArrowRight, Loader2 } from 'lucide-react';
import { CoachPrepData } from '../services/geminiService';

interface CoachPrepScreenProps {
    prepData: CoachPrepData | null;
    isLoading: boolean;
    isSessionReady: boolean;
    onBegin: () => void;
    role: string;
}
const highlightSkills = (text: string, skills: string[]): React.ReactNode => {
    if (!skills || skills.length === 0) return text;

    let result: React.ReactNode[] = [text];

    skills.forEach((skill) => {
        const newResult: React.ReactNode[] = [];
        result.forEach((segment, i) => {
            if (typeof segment === 'string') {
                const regex = new RegExp(`(${skill})`, 'gi');
                const parts = segment.split(regex);
                parts.forEach((part, j) => {
                    if (part.toLowerCase() === skill.toLowerCase()) {
                        newResult.push(
                            <span key={`${i}-${j}`} className="text-cyan-400 font-medium">
                                {part}
                            </span>
                        );
                    } else if (part) {
                        newResult.push(part);
                    }
                });
            } else {
                newResult.push(segment);
            }
        });
        result = newResult;
    });

    return result;
};

export const CoachPrepScreen: React.FC<CoachPrepScreenProps> = ({
    prepData,
    isLoading,
    isSessionReady,
    onBegin,
    role,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-app-dark md:pl-64 overflow-y-auto custom-scrollbar">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-xl my-auto"
            >
                {/* Loading State - Pulsing Dot Loader */}
                {isLoading && !prepData && (
                    <div className="flex flex-col items-center gap-6">
                        {/* Pulsing Dot */}
                        <div className="relative flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full bg-cyan-500 animate-ping absolute opacity-75"></div>
                            <div className="w-3 h-3 rounded-full bg-cyan-400 relative shadow-[0_0_20px_rgba(6,182,212,0.8)]"></div>
                        </div>
                        <h2 className="text-xl md:text-2xl font-light tracking-widest text-white uppercase font-display select-none">
                            Taking a Look...
                        </h2>
                    </div>
                )}

                {/* Content */}
                {prepData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="space-y-8"
                    >
                        {/* Greeting */}
                        <h1 className="text-2xl md:text-3xl font-semibold text-white text-center leading-relaxed">
                            {prepData.greeting}
                        </h1>

                        {/* Advice Card - Slate blue for visual distinction */}
                        <GlassCard className="p-6 md:p-8 bg-slate-700/40 border-slate-500/20">
                            <p className="text-gray-200 text-base md:text-lg leading-relaxed">
                                {highlightSkills(prepData.advice, prepData.keySkills)}
                            </p>

                            {/* Key Skills as simple bullets */}
                            {prepData.keySkills && prepData.keySkills.length > 0 && (
                                <ul className="mt-6 space-y-2">
                                    {prepData.keySkills.map((skill, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-gray-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            <span className="text-cyan-400 font-medium">{skill}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </GlassCard>

                        {/* Encouragement */}
                        <p className="text-gray-400 italic text-center text-lg">{prepData.encouragement}</p>

                        {/* Begin Button */}
                        <div className="pt-4">
                            <GlassButton
                                onClick={onBegin}
                                disabled={!isSessionReady}
                                className={`w-full py-4 text-lg font-bold transition-all ${isSessionReady
                                        ? 'bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-900/30'
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                {isSessionReady ? (
                                    <>
                                        Begin Session
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                ) : (
                                    <>
                                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                        Preparing...
                                    </>
                                )}
                            </GlassButton>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
