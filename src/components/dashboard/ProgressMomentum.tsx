import React from 'react';
import { ProgressSignal } from '../../services/coachService';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProgressMomentumProps {
  signal: ProgressSignal;
}

export const ProgressMomentum: React.FC<ProgressMomentumProps> = ({ signal }) => {
  if (signal.state === 'Loading' || signal.state === 'Empty' || signal.state === 'Low Signal') {
    return null; // Or render nothing as per constitution "No trend claims without sufficient evidence"
  }

  let Icon = Minus;
  let color = 'text-slate-500';

  if (signal.direction === 'Up') {
    Icon = TrendingUp;
    color = 'text-emerald-500';
  } else if (signal.direction === 'Uneven') {
    Icon = TrendingDown; // Or a wave icon
    color = 'text-amber-500';
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div className={`p-2 bg-white rounded-full border border-slate-100 shadow-sm ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{signal.description}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Momentum</p>
      </div>
    </div>
  );
};
