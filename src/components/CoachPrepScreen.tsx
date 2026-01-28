import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { CoachPrepData } from '../services/geminiService';

interface CoachPrepScreenProps {
  prepData: CoachPrepData | null;
  isLoading: boolean;
  isSessionReady: boolean;
  onBegin: () => void;
  onRetry?: () => void;
  role: string;
}

const highlightSkills = (text: string, skills: string[]): React.ReactNode => {
  if (!skills || skills.length === 0) return text;

  let result: React.ReactNode[] = [text];

  skills.forEach((skill) => {
    const newResult: React.ReactNode[] = [];
    result.forEach((segment, i) => {
      if (typeof segment === 'string') {
        const regex = new RegExp(`(${skill})`, 'gi');
        const parts = segment.split(regex);
        parts.forEach((part, j) => {
          if (part.toLowerCase() === skill.toLowerCase()) {
            newResult.push(
              <span key={`${i}-${j}`} className="text-rangam-orange font-bold">
                {part}
              </span>
            );
          } else if (part) {
            newResult.push(part);
          }
        });
      } else {
        newResult.push(segment);
      }
    });
    result = newResult;
  });

  return result;
};

export const CoachPrepScreen: React.FC<CoachPrepScreenProps> = ({
  prepData,
  isLoading,
  isSessionReady,
  onBegin,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white md:pl-64 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl my-auto"
      >
        {/* Loading State - Pulsing Dot Loader */}
        {isLoading && !prepData && (
          <div className="flex flex-col items-center gap-6">
            {/* Pulsing Dot */}
            <div className="relative flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-rangam-orange animate-ping absolute opacity-75"></div>
              <div className="w-3 h-3 rounded-full bg-rangam-orange relative shadow-lg"></div>
            </div>
            <h2 className="text-xl md:text-2xl font-light tracking-widest text-rangam-navy uppercase font-display select-none">
              Taking a Look...
            </h2>
          </div>
        )}

        {/* Error/Fallback State - If data fails to load */}
        {!isLoading && !prepData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8"
          >
            <Card className="p-8 text-center border-red-500/20 bg-red-50">
              <h2 className="text-xl font-bold text-red-600 mb-2">Coach Tips Unavailable</h2>
              <p className="text-slate-600 mb-6">
                We couldn't generate your personalized prep tips right now, but your interview
                session is ready.
              </p>
              <div className="w-full flex flex-col gap-3">
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    className="w-full py-6 text-base font-medium"
                  >
                    Try Again
                  </Button>
                )}
                <Button
                  onClick={onBegin}
                  disabled={!isSessionReady}
                  className="w-full py-6 text-lg font-bold shadow-lg shadow-rangam-navy/20"
                >
                  {isSessionReady ? (
                    <>
                      Begin Session
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Preparing...
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Content */}
        {prepData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-8"
          >
            {/* Greeting */}
            <h1 className="text-2xl md:text-3xl font-semibold text-rangam-navy text-center leading-relaxed font-display">
              {prepData.greeting}
            </h1>

            {/* Advice Card - Light Blue Gradient */}
            <Card className="p-6 md:p-8 border-none bg-[linear-gradient(to_bottom_right,#ffffff,rgba(36,84,255,0.1)_80%)] shadow-2xl">
              <p className="text-rangam-navy text-base md:text-lg leading-relaxed">
                {highlightSkills(prepData.advice, prepData.keySkills)}
              </p>

              {/* Key Skills as bullets */}
              {prepData.keySkills && prepData.keySkills.length > 0 && (
                <ul className="mt-6 space-y-2">
                  {prepData.keySkills.map((skill, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-rangam-navy">
                      <span className="w-1.5 h-1.5 rounded-full bg-rangam-orange" />
                      <span className="text-rangam-orange font-bold tracking-wide text-sm uppercase">
                        {skill}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Encouragement */}
            <p className="text-slate-500 italic text-center text-lg">{prepData.encouragement}</p>

            {/* Begin Button */}
            <div className="pt-4">
              <Button
                onClick={onBegin}
                disabled={!isSessionReady}
                size="lg"
                className="w-full text-lg font-bold h-14"
              >
                {isSessionReady ? (
                  <>
                    Begin Session
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Preparing...
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
