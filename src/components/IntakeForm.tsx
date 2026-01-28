import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  OnboardingIntakeV1,
  DEFAULT_ONBOARDING_INTAKE_V1,
  BIGGEST_STRUGGLE_OPTIONS,
  CHALLENGE_LEVEL_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  INTERVIEW_STAGE_OPTIONS,
  normalizeMustPracticeQuestions,
  ConfidenceScore,
  BiggestStruggle,
  ChallengeLevel,
  PrimaryGoal,
  InterviewStage,
} from '../types/intake';
import { Play, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

// --- Reusable Selection Group Component ---
interface Option {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectionGroupProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
}

const SelectionGroup: React.FC<SelectionGroupProps> = ({ options, value, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 group outline-none',
            value === opt.value
              ? 'bg-blue-50 border-rangam-blue shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          )}
        >
          {opt.icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-xl mr-4 shrink-0 transition-colors',
                value === opt.value
                  ? 'bg-white text-rangam-blue shadow-sm'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {opt.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-0.5">
              <h3
                className={cn(
                  'font-bold text-base',
                  value === opt.value ? 'text-rangam-navy' : 'text-slate-700'
                )}
              >
                {opt.label}
              </h3>
              {value === opt.value && (
                <CheckCircle2
                  size={18}
                  className="text-rangam-blue ml-2 shrink-0 animate-fade-in"
                />
              )}
            </div>
            {opt.description && (
              <p
                className={cn(
                  'text-sm leading-relaxed',
                  value === opt.value ? 'text-slate-600' : 'text-slate-500'
                )}
              >
                {opt.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

interface IntakeFormProps {
  onSubmit: (data: OnboardingIntakeV1) => void;
}

// Step definitions with coach narrative
const STEPS = [
  {
    id: 'intro',
    title: "Let's set you up to win.",
    subtitle:
      "I'm going to ask a few quick questions so this session matches your goals—whether you want a warm-up, realistic practice, or a tougher challenge. Ready? Let's go.",
  },
  {
    id: 'stage',
    title: 'What stage are you preparing for?',
    subtitle:
      "First, tell me where you are in the process. A recruiter screen is more about fit and basics, while a panel or final round gets into deeper territory. I'll adjust accordingly.",
  },
  {
    id: 'confidence',
    title: 'How are you feeling right now?',
    subtitle:
      'Be honest—are you feeling anxious (1), neutral (3), or completely ready (5)? This helps me calibrate the difficulty so we build momentum, not overwhelm you.',
  },
  {
    id: 'struggle',
    title: "What's your biggest sticking point?",
    subtitle:
      "Everyone has something they want to work on. Pick your biggest struggle and I'll focus questions and feedback on that area.",
  },
  {
    id: 'challenge',
    title: 'How challenging should the session be?',
    subtitle:
      "Warm-up is confidence building—I'll go easy. Realistic is normal interview mode. Challenge Mode? I'll throw curveballs and push for depth. Your call.",
  },
  {
    id: 'goal',
    title: "What's your primary goal this session?",
    subtitle:
      "Are you trying to get more structured, work on conciseness, practice STAR stories, or something else? I'll tailor my feedback to match.",
  },
  {
    id: 'mustPractice',
    title: 'Any specific questions to include?',
    subtitle:
      "If there are questions you know are coming—or ones you dread—type them here (one per line). I'll make sure we cover them. This is optional, so feel free to skip if you're not sure.",
  },
];

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<OnboardingIntakeV1>(DEFAULT_ONBOARDING_INTAKE_V1);
  const [rawQuestions, setRawQuestions] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const handleStart = () => {
    const questions = normalizeMustPracticeQuestions(rawQuestions.split('\n'));
    onSubmit({ ...formData, mustPracticeQuestions: questions });
  };

  const updateField = <K extends keyof OnboardingIntakeV1>(
    key: K,
    value: OnboardingIntakeV1[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleStart();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Check if current step has required field filled
  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'stage':
        return !!formData.stage;
      case 'struggle':
        return !!formData.biggestStruggle;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'intro':
        return null; // Intro has no input, just title/subtitle

      case 'stage':
        return (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <SelectionGroup
              options={INTERVIEW_STAGE_OPTIONS}
              value={formData.stage}
              onChange={(val) => updateField('stage', val as InterviewStage)}
            />
          </div>
        );

      case 'confidence': {
        // Explicitly sized thumb (20px) for precise alignment
        const percent = ((formData.confidenceScore - 1) / 4) * 100;
        return (
          <div className="space-y-4">
            <div className="relative pt-8">
              {/* Floating number above knob */}
              <div
                className="absolute top-0 transition-all duration-150"
                style={{
                  left: `calc(10px + ${percent / 100} * (100% - 20px))`,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="font-bold text-rangam-navy text-2xl">
                  {formData.confidenceScore}
                </span>
              </div>
              {/* Slider */}
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formData.confidenceScore}
                onChange={(e) =>
                  updateField('confidenceScore', Number(e.target.value) as ConfidenceScore)
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rangam-orange"
                aria-label="Confidence Score"
              />
            </div>
            <div className="flex justify-between text-lg text-slate-600 font-medium">
              <span>😰 Anxious</span>
              <span>😐 Neutral</span>
              <span>💪 Ready</span>
            </div>
          </div>
        );
      }

      case 'struggle':
        return (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <SelectionGroup
              options={BIGGEST_STRUGGLE_OPTIONS}
              value={formData.biggestStruggle}
              onChange={(val) => updateField('biggestStruggle', val as BiggestStruggle)}
            />
          </div>
        );

      case 'challenge':
        return (
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <SelectionGroup
              options={CHALLENGE_LEVEL_OPTIONS}
              value={formData.challengeLevel}
              onChange={(val) => updateField('challengeLevel', val as ChallengeLevel)}
            />
          </div>
        );

      case 'goal':
        return (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <SelectionGroup
              options={PRIMARY_GOAL_OPTIONS}
              value={formData.primaryGoal}
              onChange={(val) => updateField('primaryGoal', val as PrimaryGoal)}
            />
          </div>
        );

      case 'mustPractice':
        return (
          <div className="p-1">
            <Textarea
              placeholder="Type specific questions here (one per line)...&#10;e.g. Tell me about yourself&#10;Why this role?"
              value={rawQuestions}
              onChange={(e) => setRawQuestions(e.target.value)}
              className="min-h-[160px] text-base placeholder:text-slate-400 bg-white border-slate-200 text-slate-800 focus:border-rangam-blue focus:ring-rangam-blue/20"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];

  // --- Helper for buttons to reuse logic ---
  const renderPrevButton = () => (
    <button
      onClick={goPrev}
      disabled={currentStep === 0}
      className={`shrink-0 p-2 rounded-full transition-all duration-300 group ${
        currentStep === 0
          ? 'opacity-0 pointer-events-none'
          : 'bg-white text-rangam-blue border border-rangam-blue shadow-sm hover:bg-rangam-orange hover:text-white hover:border-rangam-orange hover:shadow-lg hover:scale-105'
      }`}
      aria-label="Previous Step"
    >
      <div className={`p-3 rounded-full transition-all duration-300`}>
        <ChevronLeft size={32} strokeWidth={1.5} />
      </div>
    </button>
  );

  const renderNextButton = () => (
    <button
      onClick={goNext}
      disabled={!canProceed()}
      className={`shrink-0 p-2 rounded-full transition-all duration-300 group ${
        !canProceed()
          ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
          : 'bg-white text-rangam-blue border border-rangam-blue shadow-sm hover:bg-rangam-orange hover:text-white hover:border-rangam-orange hover:shadow-lg hover:scale-105'
      }`}
      aria-label={isLastStep ? 'Start Session' : 'Next Step'}
    >
      <div className={`p-3 rounded-full transition-all duration-300`}>
        {isLastStep ? (
          <Play size={32} strokeWidth={1.5} className="ml-1 fill-current" />
        ) : (
          <ChevronRight size={32} strokeWidth={1.5} />
        )}
      </div>
    </button>
  );

  // --- Layout 1: Intro Card (Original Centered Layout, Responsive) ---
  if (step.id === 'intro') {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn min-h-[60vh] md:min-h-[500px] px-4">
        {/* Prev (Hidden on mobile intro, visible desktop for spacing consistency) */}
        <div className="hidden md:block">{renderPrevButton()}</div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center relative py-8 md:py-0">
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl flex flex-col items-center text-center"
          >
            <h2 className="text-3xl md:text-6xl font-display font-bold text-rangam-navy mb-6 tracking-tight">
              {step.title}
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              {step.subtitle}
            </p>
          </motion.div>

          {/* Mobile Start Button (Centered below text) */}
          <div className="md:hidden mt-4">
            <Button
              onClick={goNext}
              className="px-8 py-3 text-lg font-bold shadow-glow-orange animate-pulse"
            >
              Let's Go <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>

        <div className="hidden md:block">{renderNextButton()}</div>
      </div>
    );
  }

  // --- Layout 2: Question Cards (Responsive Split View) ---
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col pt-8 animate-fadeIn relative pb-24 md:pb-0 px-4">
      {/* Top Section: Title & Subtitle (Auto Height) */}
      <div className="w-full shrink-0 flex flex-col items-center text-center mb-6 md:mb-8 pt-4 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`title-${currentStep}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <h2 className="text-2xl md:text-5xl font-display font-bold text-rangam-navy mb-2 tracking-tight">
              {step.title}
            </h2>
            <p className="text-sm md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed px-2">
              {step.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Middle Section: Content + Desktop Navigation */}
      <div className="flex-1 min-h-0 flex items-center gap-4 w-full">
        {/* Desktop Left Arrow */}
        <div className="hidden md:block">{renderPrevButton()}</div>

        {/* Scrollable Content Area */}
        <div className="flex-1 h-full min-h-0 relative flex flex-col justify-start md:justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col justify-start md:justify-center"
            >
              <div className="w-full max-w-5xl mx-auto">{renderStepContent()}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Right Arrow */}
        <div className="hidden md:block">{renderNextButton()}</div>
      </div>

      {/* Mobile Bottom Navigation Toolbar */}
      <div className="fixed md:hidden bottom-0 inset-x-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 flex justify-between items-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className={`p-3 rounded-full border border-slate-200 ${
            currentStep === 0 ? 'opacity-30' : 'active:bg-slate-50 text-slate-600'
          }`}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Step Indicator for Mobile */}
        <div className="flex gap-1.5">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-6 bg-rangam-orange' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={!canProceed()}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            !canProceed()
              ? 'bg-slate-100 text-slate-400 border border-slate-200'
              : isLastStep
                ? 'bg-rangam-orange text-white shadow-glow-orange'
                : 'bg-white text-rangam-navy border border-slate-200 active:bg-slate-50'
          }`}
        >
          {isLastStep ? 'Start' : 'Next'}
          {isLastStep ? <Play size={16} className="fill-white" /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Desktop Progress Bar (Hidden on Mobile) */}
      <div className="hidden md:flex justify-center gap-2 mt-4 shrink-0">
        {STEPS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentStep
                ? 'w-10 bg-rangam-navy shadow-sm'
                : idx < currentStep
                  ? 'w-2 bg-rangam-orange/50'
                  : 'w-1.5 bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
