import React from 'react';
import { BaselineSignal } from '../../services/coachService';
import { Loader2 } from 'lucide-react';

interface CurrentBaselineProps {
  signal: BaselineSignal;
}

export const CurrentBaseline: React.FC<CurrentBaselineProps> = ({ signal }) => {
  if (signal.state === 'Loading') {
    return (
      <div className="h-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (signal.state === 'Empty') {
    return (
      <div className="text-center py-6">
        <h2 className="text-xl font-medium text-slate-700">{signal.text}</h2>
        <p className="text-slate-400 text-sm mt-1">{signal.grounding}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h2 className="text-2xl md:text-3xl font-medium text-rangam-navy leading-tight">
        {signal.text}
      </h2>
      <p className="text-slate-500 text-sm mt-2 border-l-2 border-slate-200 pl-3">
        {signal.grounding}
      </p>
    </div>
  );
};
