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

    const colorStyles: Record<string, { bg: string; text: string; lightBg: string; ring: string }> = {
        indigo: { bg: 'bg-blue-100', text: 'text-[#376497]', lightBg: 'bg-blue-50', ring: 'ring-blue-100' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', lightBg: 'bg-emerald-50', ring: 'ring-emerald-100' },
        violet: { bg: 'bg-violet-100', text: 'text-violet-600', lightBg: 'bg-violet-50', ring: 'ring-violet-100' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', lightBg: 'bg-blue-50', ring: 'ring-blue-100' },
        rose: { bg: 'bg-rose-100', text: 'text-rose-600', lightBg: 'bg-rose-50', ring: 'ring-rose-100' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', lightBg: 'bg-amber-50', ring: 'ring-amber-100' },
    };

    const SectionHeader = ({ id, icon: Icon, title, color }: { id: string; icon: any; title: string; color: string }) => {
        const styles = colorStyles[color] || colorStyles.indigo;
        return (
            <button
                onClick={() => toggleSection(id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${expandedSection === id ? `${styles.lightBg} ring-2 ${styles.ring}` : 'bg-white hover:bg-slate-50 border border-slate-100'
                    } mb-2`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
                        <Icon size={20} />
                    </div>
                    <span className="font-semibold text-slate-700">{title}</span>
                </div>
                {expandedSection === id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
        );
    };

    const decodeHtml = (html: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div className="w-full animate-fade-in-up h-full">
            <div className="space-y-1 pb-6">
                {/* What They're Looking For */}
                <SectionHeader id="lookingFor" icon={Target} title="What They're Looking For" color="indigo" />
                {expandedSection === 'lookingFor' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in text-slate-600 leading-relaxed italic">
                        {decodeHtml(tips.lookingFor)}
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
                                    <span className="text-slate-600">{decodeHtml(point)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Answer Framework */}
                <SectionHeader id="framework" icon={Layers} title="Answer Framework" color="violet" />
                {expandedSection === 'framework' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in text-slate-600">
                        {decodeHtml(tips.answerFramework)}
                    </div>
                )}

                {/* Industry Specifics */}
                <SectionHeader id="industry" icon={Briefcase} title="Industry Specifics" color="blue" />
                {expandedSection === 'industry' && (
                    <div className="p-5 bg-white border border-slate-100 rounded-xl mb-3 animate-fade-in space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Key Metrics</p>
                            <p className="text-slate-700 font-medium">{decodeHtml(tips.industrySpecifics.metrics)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recommended Tools</p>
                            <p className="text-slate-700 font-medium">{decodeHtml(tips.industrySpecifics.tools)}</p>
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
                                    <span className="text-slate-600">{decodeHtml(mistake)}</span>
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
                            <p className="text-slate-700 font-medium text-sm">{decodeHtml(tips.proTip)}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default QuestionTips;
