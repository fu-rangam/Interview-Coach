import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  MessageSquare,
  Mic,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  Activity,
  Target,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Question, AnalysisResult, CompetencyBlueprint } from '../../types';

interface ReviewQuestionItemProps {
  q: Question & {
    analysis?: AnalysisResult | null;
    transcript?: string;
    audioBlob?: Blob;
  };
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  hideExpandIcon?: boolean;
  className?: string;
  blueprint?: CompetencyBlueprint;
  isLoading?: boolean;
}

export const ReviewQuestionItem = memo(
  ({
    q,
    index,
    isExpanded,
    onToggle,
    hideExpandIcon = false,
    className,
    blueprint,
    isLoading = false,
  }: ReviewQuestionItemProps) => {
    // New scoring logic: Use answerScore (0-100) or fallback to rating
    const score = q.analysis?.answerScore;
    const rating = q.analysis?.rating;

    const getScoreBadgeColor = (s?: number) => {
      if (s === undefined) return 'bg-slate-100 text-slate-500 border-slate-200';
      if (s >= 80) return 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm';
      if (s >= 60) return 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm';
      return 'bg-red-50 text-red-600 border-red-200 shadow-sm';
    };

    const getScoreColor = (s?: number) => {
      if (s === undefined) return 'text-slate-400';
      if (s >= 80) return 'text-emerald-600';
      if (s >= 60) return 'text-amber-600';
      return 'text-red-600';
    };

    return (
      <div
        className={cn(
          'transition-all duration-300 border-l-4 border-t border-r border-b border-t-slate-200 border-r-slate-200 border-b-slate-200 bg-white shadow-sm rounded-xl',
          score !== undefined
            ? score >= 80
              ? 'border-l-emerald-500'
              : score >= 60
                ? 'border-l-amber-500'
                : 'border-l-red-500'
            : 'border-l-slate-300',
          className
        )}
      >
        {/* Q# Badge */}
        <div className="p-6 md:px-8 pb-0 animate-fade-in">
          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 shadow-sm">
            Q{index + 1}
          </span>
        </div>

        {/* Coach Reaction (Top of Expanded) */}
        {isExpanded && q.analysis?.coachReaction && (
          <>
            <div className="px-6 md:px-8 pt-4 pb-0 animate-fade-in text-left">
              <div className="space-y-2">
                <p className="font-display text-3xl md:text-3xl font-medium leading-tight text-rangam-navy drop-shadow-sm">
                  "{q.analysis.coachReaction}"
                </p>
              </div>
            </div>
            {/* Separator */}
            <div className="h-px w-full bg-slate-100 mt-8 mb-2" />
          </>
        )}

        {/* Summary Row (Clickable) */}
        <div
          onClick={() => onToggle(q.id)}
          className={cn(
            'p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
            !hideExpandIcon ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {q.type && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rangam-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {q.type}
                  </span>
                )}
                {q.difficulty && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {q.difficulty}
                  </span>
                )}
              </div>

              {/* Score & Caret */}
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
                    getScoreBadgeColor(score)
                  )}
                >
                  {score !== undefined ? `${score}/100` : rating || 'Pending'}
                </span>
                {!hideExpandIcon &&
                  (isExpanded ? (
                    <ChevronUp className="text-slate-400" />
                  ) : (
                    <ChevronDown className="text-slate-400" />
                  ))}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-rangam-navy group-hover:text-rangam-blue transition-colors">
              {q.text}
            </h3>
            {!isExpanded && !hideExpandIcon && (
              <p className="text-sm text-slate-500 mt-1">Click to reveal detailed feedback...</p>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50/50">
                {/* Transcript */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Mic size={14} className="text-rangam-blue" /> Your Answer
                  </h4>
                  <div className="p-4 md:p-6 rounded-2xl bg-white text-slate-700 text-lg leading-relaxed border border-slate-200 font-serif italic shadow-sm">
                    "{q.transcript}"
                  </div>
                </div>

                {q.analysis ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                      {/* Left Column: Delivery & Dimensions */}
                      <div className="space-y-8">
                        {/* Speaking Delivery */}
                        {q.analysis.deliveryTips && q.analysis.deliveryTips.length > 0 && (
                          <div className="bg-blue-50 rounded-xl p-4 md:p-6 border border-blue-100">
                            <h4 className="text-sm font-bold text-rangam-blue uppercase tracking-wider flex items-center gap-2 mb-4">
                              <Mic size={14} /> Speaking Delivery
                            </h4>
                            {q.analysis.deliveryStatus && (
                              <div className="mb-4">
                                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                  {q.analysis.deliveryStatus}
                                </span>
                              </div>
                            )}
                            <ul className="space-y-3">
                              {q.analysis.deliveryTips.map((tip, idx) => (
                                <li key={idx} className="text-sm text-slate-600 flex gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rangam-blue mt-1.5 shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Dimensions */}
                        {q.analysis.dimensionScores && q.analysis.dimensionScores.length > 0 && (
                          <div className="space-y-5">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <Activity size={14} className="text-purple-500" /> Dimensions
                            </h4>
                            <div className="space-y-4">
                              {q.analysis.dimensionScores
                                .filter((ds) => ds.dimensionId !== 'dimensionId')
                                .map((ds, idx) => {
                                  let dimName = ds.dimensionId;
                                  let dimWeight: number | undefined;
                                  let relativeWeight: number | undefined;

                                  if (blueprint?.scoringModel?.dimensions) {
                                    const dimensions = blueprint.scoringModel.dimensions;
                                    const totalWeight = dimensions.reduce(
                                      (sum, d) => sum + (d.weight || 0),
                                      0
                                    );

                                    const found = dimensions.find((d) => d.id === ds.dimensionId);
                                    if (found) {
                                      dimName = found.name;
                                      dimWeight = found.weight;
                                      if (totalWeight > 0 && dimWeight !== undefined) {
                                        relativeWeight = (dimWeight / totalWeight) * 100;
                                      }
                                    }
                                  }

                                  if (dimName === ds.dimensionId && dimName.includes('_')) {
                                    dimName = dimName
                                      .split('_')
                                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                      .join(' ');
                                  }

                                  return (
                                    <div key={idx} className="space-y-2">
                                      <div className="flex justify-between items-end">
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-sm text-slate-700 font-medium">
                                            {dimName}
                                          </span>
                                          {relativeWeight !== undefined && (
                                            <span className="text-xs text-slate-400">
                                              ({Math.round(relativeWeight)}%)
                                            </span>
                                          )}
                                        </div>
                                        <span
                                          className={cn(
                                            'font-mono font-bold text-sm',
                                            getScoreColor(ds.score)
                                          )}
                                        >
                                          {ds.score}/100
                                        </span>
                                      </div>
                                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                                        <div
                                          className="h-full rounded-full overflow-hidden absolute left-0 top-0 transition-all duration-500"
                                          style={{ width: `${ds.score}%` }}
                                        >
                                          <div
                                            className="h-full"
                                            style={{
                                              width: `${ds.score > 0 ? (100 / ds.score) * 100 : 100}%`,
                                              backgroundImage:
                                                'linear-gradient(to right, #0e7490 0%, #059669 70%, #34d399 100%)',
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-500 leading-snug">
                                        {ds.note}
                                      </p>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Signals, Missing, Big Change, Redo */}
                      <div className="space-y-6">
                        {/* Feedback Signals Grid */}
                        <div className="grid grid-cols-1 gap-6">
                          {/* Signals Detected */}
                          {q.analysis.evidenceExtracts &&
                            q.analysis.evidenceExtracts.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                  Signals Detected
                                </h4>
                                <ul className="space-y-2">
                                  {q.analysis.evidenceExtracts.slice(0, 3).map((ex, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                                      <CheckCircle2
                                        size={16}
                                        className="text-emerald-500 shrink-0 mt-0.5"
                                      />
                                      "{ex}"
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Missing Signals */}
                          {q.analysis.missingElements && q.analysis.missingElements.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">
                                Missing Signals
                              </h4>
                              <ul className="space-y-2">
                                {q.analysis.missingElements.slice(0, 3).map((miss, i) => (
                                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                                    <span className="w-4 h-4 rounded-full border border-red-500/50 flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-red-500 font-bold">
                                      !
                                    </span>
                                    {miss}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* One Big Change */}
                        {q.analysis.biggestUpgrade && (
                          <div className="bg-purple-50 rounded-xl p-4 md:p-6 border border-purple-100">
                            <h4 className="text-sm font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                              <Target size={14} /> One Big Upgrade
                            </h4>
                            <p className="text-slate-700 text-sm leading-relaxed">
                              {q.analysis.biggestUpgrade}
                            </p>
                          </div>
                        )}

                        {/* Try Saying This */}
                        {q.analysis.redoPrompt && (
                          <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold text-rangam-blue uppercase tracking-wider flex items-center gap-2 mb-3">
                              <RotateCcw size={14} /> Try Saying This
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed italic border-l-2 border-rangam-blue pl-4 py-1">
                              "{q.analysis.redoPrompt}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Strong Answer Section */}
                    {q.analysis.strongResponse && (
                      <>
                        <div className="h-px w-full bg-amber-100 mt-8 mb-6" />

                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2">
                            <Star size={14} className="text-amber-500" /> Strong Answer Example
                          </h4>
                          <div className="p-4 md:p-6 rounded-2xl bg-amber-50 text-slate-700 text-base leading-relaxed border border-amber-100 font-serif italic">
                            "{q.analysis.strongResponse}"
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 border border-slate-200 rounded-xl bg-slate-50">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-rangam-blue animate-spin mb-2" />
                        <p className="text-slate-500 text-xs text-center">
                          AI Analysis in progress...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-slate-100">
                          <MessageSquare className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-xs text-center">
                          No AI feedback available for this answer.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
