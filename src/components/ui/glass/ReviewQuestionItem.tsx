import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';

import GlassTips from './GlassTips';
import {
  CheckCircle2,
  MessageSquare,
  Mic,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckSquare,
  Activity,
  Target,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Question, AnalysisResult, CompetencyBlueprint } from '../../../types';

// Helper Functions
const getRatingBadge = (rating?: string) => {
  switch (rating) {
    case 'Strong':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    case 'Good':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
    case 'Developing':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

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

    // Helper to colorize score
    const getScoreColor = (s?: number) => {
      if (s === undefined) return 'text-gray-400';
      if (s >= 80) return 'text-emerald-400';
      if (s >= 60) return 'text-amber-400';
      return 'text-red-400';
    };

    const getScoreBadgeColor = (s?: number) => {
      if (s === undefined) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      if (s >= 80)
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      if (s >= 60)
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      return 'bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]';
    };

    return (
      <GlassCard
        className={cn(
          'transition-all duration-300 border-l-4 border-t border-t-cyan-500/30',
          score !== undefined
            ? score >= 80
              ? 'border-l-emerald-500'
              : score >= 60
                ? 'border-l-amber-500'
                : 'border-l-red-500'
            : 'border-l-gray-500',
          className
        )}
      >
        {/* Q# Badge (Moved to Top) */}
        <div className="p-6 md:px-8 pb-0 animate-fade-in">
          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-full bg-white/5 text-white ring-1 ring-white/10 shadow-sm">
            Q{index + 1}
          </span>
        </div>

        {/* 0. Coach Reaction (Top of Modal) */}
        {isExpanded && q.analysis?.coachReaction && (
          <>
            <div className="px-6 md:px-8 pt-4 pb-0 animate-fade-in text-left">
              <div className="space-y-2">
                <p className="font-display text-3xl md:text-4xl font-medium leading-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-100 to-blue-200 drop-shadow-sm">
                  "{q.analysis.coachReaction}"
                </p>
              </div>
            </div>
            {/* Separator */}
            <div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent mt-8 mb-2" />
          </>
        )}

        {/* Summary Row (Clickable) */}
        <div
          onClick={() => onToggle(q.id)}
          className={cn(
            'p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4',
            !hideExpandIcon ? 'cursor-pointer' : 'cursor-default'
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {q.type && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                    {q.type}
                  </span>
                )}
                {q.difficulty && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/20">
                    {q.difficulty}
                  </span>
                )}
              </div>

              {/* Score & Caret (Moved Inline) */}
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
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  ))}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {q.text}
            </h3>
            {!isExpanded && !hideExpandIcon && (
              <p className="text-sm text-gray-500 mt-1">Click to reveal detailed feedback...</p>
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
              className="overflow-hidden border-t border-white/10"
            >
              <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                {/* 2. Question Text (Repeated for Context if needed, but handled by summary row usually. User asked for it below reaction) */}
                {/* ... */}

                {/* 3. Transcript (Full Width) */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Mic size={14} className="text-cyan-400" /> Your Answer
                  </h4>
                  <div className="p-4 md:p-6 rounded-2xl bg-black/20 text-gray-200 text-lg leading-relaxed border border-white/5 font-serif italic">
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
                          <div className="bg-blue-500/10 rounded-xl p-4 md:p-6 border border-blue-500/20">
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                              <Mic size={14} /> Speaking Delivery
                            </h4>
                            {q.analysis.deliveryStatus && (
                              <div className="mb-4">
                                <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                                  {q.analysis.deliveryStatus}
                                </span>
                              </div>
                            )}
                            <ul className="space-y-3">
                              {q.analysis.deliveryTips.map((tip, idx) => (
                                <li key={idx} className="text-sm text-gray-300 flex gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Dimensions */}
                        {q.analysis.dimensionScores && q.analysis.dimensionScores.length > 0 && (
                          <div className="space-y-5">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <Activity size={14} className="text-purple-400" /> Dimensions
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
                                          <span className="text-sm text-gray-200 font-medium">
                                            {dimName}
                                          </span>
                                          {relativeWeight !== undefined && (
                                            <span className="text-xs text-gray-500">
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
                                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
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
                                      <p className="text-xs text-gray-400 leading-snug">
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
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                  Signals Detected
                                </h4>
                                <ul className="space-y-2">
                                  {q.analysis.evidenceExtracts.slice(0, 3).map((ex, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex gap-2">
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
                              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                                Missing Signals
                              </h4>
                              <ul className="space-y-2">
                                {q.analysis.missingElements.slice(0, 3).map((miss, i) => (
                                  <li key={i} className="text-sm text-gray-300 flex gap-2">
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
                          <div className="bg-purple-500/10 rounded-xl p-4 md:p-6 border border-purple-500/20">
                            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                              <Target size={14} /> One Big Upgrade
                            </h4>
                            <p className="text-gray-200 text-sm leading-relaxed">
                              {q.analysis.biggestUpgrade}
                            </p>
                          </div>
                        )}

                        {/* Try Saying This */}
                        {q.analysis.redoPrompt && (
                          <div className="bg-zinc-900 rounded-xl p-4 md:p-6 border border-white/10">
                            <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                              <RotateCcw size={14} /> Try Saying This
                            </h4>
                            <p className="text-gray-300 text-sm leading-relaxed italic border-l-2 border-cyan-500/50 pl-4 py-1">
                              "{q.analysis.redoPrompt}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Strong Answer Section (Full Width) */}
                    {q.analysis.strongResponse && (
                      <>
                        {/* Horizontal Separator */}
                        <div className="h-px w-full bg-linear-to-r from-transparent via-amber-500/30 to-transparent mt-8 mb-6" />

                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <Star size={14} className="text-amber-300" /> Strong Answer Example
                          </h4>
                          <div className="p-4 md:p-6 rounded-2xl bg-amber-500/5 text-gray-200 text-base leading-relaxed border border-amber-500/20 font-serif italic">
                            "{q.analysis.strongResponse}"
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 border border-white/10 rounded-xl bg-white/5">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                        <p className="text-gray-400 text-xs text-center">
                          AI Analysis in progress...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-gray-500 text-xs text-center">
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
      </GlassCard>
    );
  }
);
