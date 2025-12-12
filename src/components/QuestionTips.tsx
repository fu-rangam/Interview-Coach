import React, { useState } from 'react';
import { QuestionTips as QuestionTipsType } from '../types';
import { Lightbulb, Target, Layers, AlertTriangle, Star, CheckSquare, Sparkles, ChevronDown, ChevronUp, Briefcase } from './Icons';

interface QuestionTipsProps {
    tips?: QuestionTipsType;
}

const QuestionTips: React.FC<QuestionTipsProps> = ({ tips }) => {
    if (!tips) return null;

    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const SectionHeader = ({ id, icon: Icon, title, color }: { id: string; icon: any; title: string; color: string }) => (
        <button
            onClick={() => toggleSection(id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${expandedSection === id ? `bg-${color}-50 ring-2 ring-${color}-100` : 'bg-white hover:bg-slate-50 border border-slate-100'
                } mb-2`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
                    <Icon size={20} />
                </div>
                <span className="font-semibold text-slate-700">{title}</span>
            </div>
            {expandedSection === id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>
    );

    return (
        <div className="w-full animate-fade-in-up h-full">
            <div className="space-y-1 pb-6">
                {/* What They're Looking For */}
                <SectionHeader id="lookingFor" icon={Target} title="What They're Looking For" color="indigo" />
                {expandedSection === 'lookingFor' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in text-slate-600 leading-relaxed italic">
                        {tips.lookingFor}
                    </div>
                )}

                {/* Specific Points to Cover */}
                <SectionHeader id="pointsToCover" icon={CheckSquare} title="Specific Points to Cover" color="emerald" />
                {expandedSection === 'pointsToCover' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in">
                        <ul className="space-y-3">
                            {tips.pointsToCover.map((point, index) => (
                                <li key={index} className="flex gap-3 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                        {index + 1}
                                    </span>
                                    <span className="text-slate-600">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Answer Framework */}
                <SectionHeader id="framework" icon={Layers} title="Answer Framework" color="violet" />
                {expandedSection === 'framework' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in text-slate-600">
                        {tips.answerFramework}
                    </div>
                )}

                {/* Industry Specifics */}
                <SectionHeader id="industry" icon={Briefcase} title="Industry Specifics" color="blue" />
                {expandedSection === 'industry' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Key Metrics</p>
                            <p className="text-slate-700 font-medium">{tips.industrySpecifics.metrics}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recommended Tools</p>
                            <p className="text-slate-700 font-medium">{tips.industrySpecifics.tools}</p>
                        </div>
                    </div>
                )}

                {/* Critical Mistakes to Avoid */}
                <SectionHeader id="mistakes" icon={AlertTriangle} title="Critical Mistakes to Avoid" color="rose" />
                {expandedSection === 'mistakes' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in">
                        <ul className="space-y-3">
                            {tips.mistakesToAvoid.map((mistake, index) => (
                                <li key={index} className="flex gap-3 items-start">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-400 mt-2"></span>
                                    <span className="text-slate-600">{mistake}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Expert Pro Tip */}
                <SectionHeader id="protip" icon={Star} title="Expert Pro Tip" color="amber" />
                {expandedSection === 'protip' && (
                    <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl mb-3 animate-fade-in">
                        <div className="flex gap-3">
                            <Sparkles className="text-amber-500 shrink-0" size={20} />
                            <p className="text-slate-700 font-medium text-sm">{tips.proTip}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default QuestionTips;
