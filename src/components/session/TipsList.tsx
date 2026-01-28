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
import { cn } from '../../lib/utils';
import { QuestionTips as QuestionTipsType } from '../../types';

interface TipsListProps {
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
  icon: React.ElementType;
  title: string;
  color: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  // Light Mode Colors for the Expanded Container
  const containerStyles: Record<string, { bg: string; border: string }> = {
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100' },
  };

  // Icon Styles - Only text color changes
  const iconStyles: Record<string, string> = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
    blue: 'text-blue-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
  };

  const containerStyle = containerStyles[color] || containerStyles.indigo;
  const iconStyle = iconStyles[color] || iconStyles.indigo;

  return (
    <button
      onClick={() => onToggle(id)}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border mb-2',
        isExpanded
          ? `${containerStyle.bg} ${containerStyle.border} shadow-sm`
          : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon "Sticker" */}
        <div
          className={cn(
            'p-2.5 rounded-xl transition-all duration-300',
            isExpanded
              ? `bg-slate-100 ${iconStyle} scale-110 shadow-sm`
              : `bg-slate-100 text-slate-500 group-hover:bg-slate-200 scale-100`
          )}
        >
          <Icon size={18} />
        </div>

        <span
          className={cn(
            'font-medium text-sm transition-colors text-left',
            isExpanded ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
          )}
        >
          {title}
        </span>
      </div>
      {isExpanded ? (
        <ChevronUp size={16} className="text-slate-400" />
      ) : (
        <ChevronDown size={16} className="text-slate-300" />
      )}
    </button>
  );
};

export const TipsList: React.FC<TipsListProps> = ({ tips, className }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('lookingFor');

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  if (!tips)
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-rangam-blue animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto text-rangam-blue animate-pulse" size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 animate-pulse">
            Creating custom tips for this question...
          </p>
          <p className="text-xs text-slate-400 mt-2">Analyzing job description context</p>
        </div>
      </div>
    );

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
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg mb-3 text-slate-600 text-sm leading-relaxed text-left shadow-sm ml-2 mr-2">
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
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg mb-3 text-left shadow-sm ml-2 mr-2">
                <ul className="space-y-3">
                  {tips.pointsToCover.map((point, index) => (
                    <li key={index} className="flex gap-3 items-start text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mt-0.5 border border-emerald-200">
                        {index + 1}
                      </span>
                      <span className="text-slate-600">{decodeHtml(point)}</span>
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
              <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-lg mb-3 text-slate-600 text-sm text-left shadow-sm ml-2 mr-2">
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
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg mb-3 space-y-4 text-left shadow-sm ml-2 mr-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Key Metrics
                  </p>
                  <p className="text-slate-700 font-medium text-sm">
                    {decodeHtml(tips.industrySpecifics.metrics)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Recommended Tools
                  </p>
                  <p className="text-slate-700 font-medium text-sm">
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
              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-lg mb-3 text-left shadow-sm ml-2 mr-2">
                <ul className="space-y-3">
                  {tips.mistakesToAvoid.map((mistake, index) => (
                    <li key={index} className="flex gap-3 items-start text-sm">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shadow-sm"></span>
                      <span className="text-slate-600">{decodeHtml(mistake)}</span>
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
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg mb-3 text-left shadow-sm ml-2 mr-2">
                <div className="flex gap-3">
                  <Sparkles className="text-amber-500 shrink-0" size={18} />
                  <p className="text-amber-900 font-medium text-sm">{decodeHtml(tips.proTip)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
