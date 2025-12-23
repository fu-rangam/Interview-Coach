import React from 'react';
import { Check } from './Icons';
import { cn } from '../lib/utils';
import { Question } from '../types';

interface QuestionListProps {
    questions: Question[];
    currentIndex: number;
    answers: Record<string, any>;
    onSelect: (index: number) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, currentIndex, answers, onSelect }) => {
    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <div className="px-6 py-6 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-wider">Question Set</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {questions.map((q, index) => {
                    const isActive = index === currentIndex;
                    const isAnswered = !!answers[q.id];

                    return (
                        <button
                            key={q.id}
                            onClick={() => onSelect(index)}
                            className={cn(
                                "w-full text-left p-4 rounded-xl text-sm transition-all duration-200 relative group flex gap-3 items-start",
                                isActive
                                    ? "bg-blue-50/80 text-[#1e3a5f] shadow-sm ring-1 ring-blue-100"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all",
                                isAnswered
                                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                                    : isActive
                                        ? "bg-[#376497] text-white shadow-sm shadow-blue-200"
                                        : "bg-slate-100 text-slate-400"
                            )}>
                                {isAnswered ? <Check size={12} strokeWidth={3} /> : index + 1}
                            </div>
                            <span className={cn(
                                "leading-relaxed wrap-break-word", // Removed line-clamp-2
                                isActive ? "font-semibold" : "font-medium"
                            )}>
                                {/* We will rely on parent passing decoded text or decode here if needed, 
                                    but usually better to keep pure. The parent Interview.tsx does decoding.
                                    Let's handle HTML dangerously or assume clean text? 
                                    The existing code used a helper decodeHtml. 
                                    Let's add a simple decoder here or accept rendered react node?
                                    Simplest is to re-implement decodeHtml locally or utility.
                                */}
                                <span dangerouslySetInnerHTML={{ __html: q.text }} />
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestionList;
