import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Layers,
  AlertTriangle,
  Star,
  CheckSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { QuestionTips as QuestionTipsType } from '../../../types';

interface GlassTipsProps {
  tips?: QuestionTipsType;
  className?: string;
}

const SectionHeader = ({
  id,
  icon: Icon,
  title,
  color,
  isExpanded,
  onToggle,
}: {
  id: string;
  icon: any;
  title: string;
  color: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  // Glass/Dark Mode Colors for the Expanded Container
  const containerStyles: Record<string, { bg: string; border: string }> = {
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  };

  // "Sticker" Styles for the Icon (Always visible)
  const iconStyles: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    emerald: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    violet: 'bg-violet-500/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)]',
    blue: 'bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    rose: 'bg-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    amber: 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  };

  const textColors: Record<string, string> = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
  };

  const containerStyle = containerStyles[color] || containerStyles.indigo;
  const iconStyle = iconStyles[color] || iconStyles.indigo;
  const textColor = textColors[color] || textColors.indigo;

  return (
    <button
      onClick={() => onToggle(id)}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border mb-2',
        isExpanded
          ? `${containerStyle.bg} ${containerStyle.border} shadow-lg`
          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon "Sticker" */}
        <div
          className={cn(
            'p-2.5 rounded-xl transition-all duration-300',
            isExpanded
              ? `${iconStyle} text-white! scale-110`
              : `bg-white/5 ${textColor} group-hover:bg-white/10 scale-100`
          )}
        >
          <Icon size={18} />
        </div>

        <span
          className={cn(
            'font-medium text-sm transition-colors text-left',
            isExpanded ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
          )}
        >
          {title}
        </span>
      </div>
      {isExpanded ? (
        <ChevronUp size={16} className="text-white/50" />
      ) : (
        <ChevronDown size={16} className="text-white/30" />
      )}
    </button>
  );
};

const GlassTips: React.FC<GlassTipsProps> = ({ tips, className }) => {
  if (!tips)
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-cyan-200 animate-pulse">
            Creating custom tips for this question...
          </p>
          <p className="text-xs text-gray-500 mt-2">Analyzing job description context</p>
        </div>
      </div>
    );

  const [expandedSection, setExpandedSection] = useState<string | null>('lookingFor');

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  return (
    <div className={cn('w-full h-full overflow-y-auto pr-2 custom-scrollbar text-left', className)}>
      <div className="space-y-1 pb-6">
        {/* What They're Looking For */}
        <SectionHeader
          id="lookingFor"
          icon={Target}
          title="What They're Looking For"
          color="indigo"
          isExpanded={expandedSection === 'lookingFor'}
          onToggle={toggleSection}
        />
        <AnimatePresence>
          {expandedSection === 'lookingFor' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-black/20 border border-white/5 rounded-lg mb-3 text-gray-300 text-sm leading-relaxed text-left">
                {decodeHtml(tips.lookingFor)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Specific Points to Cover */}
        <SectionHeader
          id="pointsToCover"
          icon={CheckSquare}
          title="Points to Cover"
          color="emerald"
          isExpanded={expandedSection === 'pointsToCover'}
          onToggle={toggleSection}
        />
        <AnimatePresence>
          {expandedSection === 'pointsToCover' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-black/20 border border-white/5 rounded-lg mb-3 text-left">
                <ul className="space-y-3">
                  {tips.pointsToCover.map((point, index) => (
                    <li key={index} className="flex gap-3 items-start text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5 border border-emerald-500/20">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{decodeHtml(point)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Framework */}
        <SectionHeader
          id="framework"
          icon={Layers}
          title="Answer Framework"
          color="violet"
          isExpanded={expandedSection === 'framework'}
          onToggle={toggleSection}
        />
        <AnimatePresence>
          {expandedSection === 'framework' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-black/20 border border-white/5 rounded-lg mb-3 text-gray-300 text-sm text-left">
                {decodeHtml(tips.answerFramework)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Industry Specifics */}
        <SectionHeader
          id="industry"
          icon={Briefcase}
          title="Industry Specifics"
          color="blue"
          isExpanded={expandedSection === 'industry'}
          onToggle={toggleSection}
        />
        <AnimatePresence>
          {expandedSection === 'industry' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-black/20 border border-white/5 rounded-lg mb-3 space-y-4 text-left">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Key Metrics
                  </p>
                  <p className="text-gray-300 font-medium text-sm">
                    {decodeHtml(tips.industrySpecifics.metrics)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Recommended Tools
                  </p>
                  <p className="text-gray-300 font-medium text-sm">
                    {decodeHtml(tips.industrySpecifics.tools)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Critical Mistakes to Avoid */}
        <SectionHeader
          id="mistakes"
          icon={AlertTriangle}
          title="Mistakes to Avoid"
          color="rose"
          isExpanded={expandedSection === 'mistakes'}
          onToggle={toggleSection}
        />
        <AnimatePresence>
          {expandedSection === 'mistakes' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-black/20 border border-white/5 rounded-lg mb-3 text-left">
                <ul className="space-y-3">
                  {tips.mistakesToAvoid.map((mistake, index) => (
                    <li key={index} className="flex gap-3 items-start text-sm">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></span>
                      <span className="text-gray-300">{decodeHtml(mistake)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expert Pro Tip */}
        <SectionHeader
          id="protip"
          icon={Star}
          title="Pro Tip"
          color="amber"
          isExpanded={expandedSection === 'protip'}
          onToggle={toggleSection}
        />
        <AnimatePresence>
          {expandedSection === 'protip' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg mb-3 text-left">
                <div className="flex gap-3">
                  <Sparkles className="text-amber-400 shrink-0" size={18} />
                  <p className="text-amber-100 font-medium text-sm">{decodeHtml(tips.proTip)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GlassTips;
