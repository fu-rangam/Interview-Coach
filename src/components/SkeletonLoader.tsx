import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonLoaderProps {
    variant?: 'interview' | 'review' | 'history';
    text?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'review', text }) => {

    if (variant === 'history') {
        return (
            <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                    <div className="w-32 h-6 rounded-full bg-slate-200 animate-pulse"></div>
                </div>

                <div className="flex-1 overflow-y-auto w-full p-8 md:p-12">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div className="space-y-3">
                                <div className="w-64 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div className="w-48 h-6 rounded-lg bg-slate-100 animate-pulse"></div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-24 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div className="w-32 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Cards List */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-full h-32 rounded-xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-center space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                                        <div className="w-64 h-6 rounded-lg bg-slate-100 animate-pulse"></div>
                                    </div>
                                    <div className="w-20 h-6 rounded-full bg-slate-100 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Loading Text Overlay */}
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-slate-400 font-medium text-sm animate-pulse flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#376497]"></div>
                    {text || "Analyzing session data..."}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">


            <div className={cn(
                "flex h-full relative",
                variant === 'interview' ? "flex-col lg:flex-row" : "flex-col md:flex-row"
            )}>
                {/* 
                  Layout Logic: 
                  Interview: 3 columns (20% | 45% | 35%) - lg breakpoint
                  Review: 2 columns (50% | 50%) - md breakpoint
                */}

                {/* Column 1: Interview Sidebar (20%) - Interview Only */}
                {variant === 'interview' && (
                    <div className="hidden lg:flex w-[20%] h-full flex-col bg-white border-r border-slate-200 p-4 space-y-4">
                        <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-3 items-center p-2">
                                <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                                <div className="h-3 w-full bg-slate-100 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Column 2: Main Content */}
                <div className={cn(
                    "h-full flex flex-col bg-white",
                    variant === 'interview'
                        ? "w-full lg:w-[45%] lg:border-r border-slate-200 lg:bg-slate-50 p-8"
                        : "w-full md:w-1/2 md:border-r border-slate-200"
                )}>
                    {variant === 'review' ? (
                        <div className="w-full h-full md:overflow-y-auto p-6 md:p-12 max-w-xl mx-auto pb-12 md:pb-24">
                            {/* Breadcrumb / Label */}
                            <div className="w-24 h-4 rounded-md bg-slate-200 animate-pulse mb-3"></div>

                            {/* Main Card/Question Skeleton */}
                            <div className="w-full space-y-6">
                                <div className="h-8 w-3/4 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div className="h-8 w-full rounded-lg bg-slate-200 animate-pulse mb-8"></div>

                                {/* Transcript box placeholder for Review */}
                                <div className="bg-slate-50/50 p-8 rounded-2xl mb-8 border border-slate-100 shadow-inner space-y-4">
                                    <div className="w-32 h-3 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="space-y-2">
                                        <div className="w-full h-3 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="w-full h-3 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="w-4/5 h-3 bg-slate-100 rounded animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Action Buttons - Review Style */}
                                <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100">
                                    <div className="h-12 flex-1 rounded-xl bg-slate-200 animate-pulse"></div>
                                    <div className="h-12 flex-1 rounded-xl bg-slate-200 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // INTERVIEW VARIANT (existing structure)
                        <div className="space-y-6">
                            <div className="w-24 h-4 rounded-md bg-slate-200 animate-pulse mb-8"></div>
                            <div className="w-full max-w-xl mx-auto space-y-6">
                                <div className="h-8 w-3/4 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div className="h-8 w-1/2 rounded-lg bg-slate-200 animate-pulse"></div>
                                <div className="h-40 w-full rounded-2xl bg-slate-100 animate-pulse mt-8 border border-slate-200"></div>
                                <div className="flex gap-4 mt-8">
                                    <div className="h-12 flex-1 rounded-xl bg-slate-200 animate-pulse"></div>
                                    <div className="h-12 flex-1 rounded-xl bg-slate-200 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 3: 
                   Interview: Tips (35%)
                   Review: Insights (50%)
                */}
                <div className={cn(
                    "h-full flex-col",
                    variant === 'interview'
                        ? "hidden lg:flex lg:w-[35%] bg-slate-50/50 p-8 space-y-6"
                        : "hidden md:flex md:w-1/2 bg-slate-50/80"
                )}>
                    {variant === 'review' ? (
                        <div className="w-full h-full md:overflow-y-auto p-6 md:p-12 max-w-xl mx-auto pb-24">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-32 h-8 rounded-lg bg-slate-200 animate-pulse"></div>
                                    <div className="w-24 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                                </div>

                                {/* Key Terms Card Placeholder */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 animate-pulse"></div>
                                        <div className="w-40 h-5 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-8 w-20 rounded-lg bg-slate-100 animate-pulse border border-slate-200/50"></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback Card Placeholder */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 animate-pulse"></div>
                                        <div className="w-24 h-5 rounded bg-slate-200 animate-pulse"></div>
                                    </div>
                                    <ul className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <li key={i} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50/50">
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 animate-pulse shrink-0"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-full h-3 bg-slate-100 rounded animate-pulse"></div>
                                                    <div className="w-4/5 h-3 bg-slate-100 rounded animate-pulse"></div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // INTERVIEW TIPS VARIANT
                        <div className="w-full mx-auto space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-6 h-6 rounded bg-slate-200 animate-pulse"></div>
                                <div className="w-40 h-5 rounded bg-slate-200 animate-pulse"></div>
                            </div>

                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-full h-32 rounded-xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
                                    <div className="w-1/3 h-4 rounded bg-slate-100 animate-pulse"></div>
                                    <div className="w-full h-3 rounded bg-slate-50 animate-pulse"></div>
                                    <div className="w-5/6 h-3 rounded bg-slate-50 animate-pulse"></div>
                                    <div className="w-4/6 h-3 rounded bg-slate-50 animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading Text Overlay */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-slate-400 font-medium text-sm animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#376497]"></div>
                {text || "Restoring your session..."}
            </div>
        </div>
    );
};

export default SkeletonLoader;
