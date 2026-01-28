import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { CoachingFocusSignal } from '../../services/coachService';
import { ArrowRight, Lightbulb, Loader2, Target } from 'lucide-react';

interface CoachingFocusProps {
  signal: CoachingFocusSignal;
  onActionClick?: () => void;
}

export const CoachingFocus: React.FC<CoachingFocusProps> = ({ signal, onActionClick }) => {
  if (signal.state === 'Loading') return <SkeletonCard />;
  if (signal.state === 'Empty') return null; // Should ideally show foundational, handled by service

  return (
    <Card className="h-full border-l-4 border-l-rangam-blue overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1 text-rangam-blue">
          <Target className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Current Focus</span>
        </div>
        <CardTitle className="text-xl text-rangam-navy">{signal.focus}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-slate-600 text-sm leading-relaxed">{signal.rationale}</p>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t border-slate-100 p-4">
        <div className="w-full">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-white p-1 rounded-full border border-slate-200 text-amber-500 shadow-xs">
              <Lightbulb size={14} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block mb-0.5">
                Recommended Action
              </span>
              <p className="text-sm font-medium text-slate-800">{signal.action}</p>
            </div>
          </div>

          <Button
            onClick={onActionClick}
            className="w-full bg-rangam-blue hover:bg-blue-700 text-white group"
          >
            Start Practice
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const SkeletonCard = () => (
  <Card className="h-full border-slate-100">
    <CardContent className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-slate-300" />
    </CardContent>
  </Card>
);
