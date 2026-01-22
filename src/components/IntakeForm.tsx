import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/glass/GlassCard';
import { GlassButton } from './ui/glass/GlassButton';
import { GlassTextarea } from './ui/glass/GlassTextarea';
import { GlassRadioGroup } from './ui/glass/GlassRadioGroup';
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
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

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
            <GlassRadioGroup
              options={INTERVIEW_STAGE_OPTIONS}
              value={formData.stage}
              onChange={(val) => updateField('stage', val as InterviewStage)}
              columns={1}
            />
          </div>
        );

      case 'confidence':
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
                <span className="font-bold text-cyan-700 text-2xl">{formData.confidenceScore}</span>
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
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
                aria-label="Confidence Score"
              />
            </div>
            <div className="flex justify-between text-lg text-gray-400 font-medium">
              <span>😰 Anxious</span>
              <span>😐 Neutral</span>
              <span>💪 Ready</span>
            </div>
          </div>
        );

      case 'struggle':
        return (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <GlassRadioGroup
              options={BIGGEST_STRUGGLE_OPTIONS}
              value={formData.biggestStruggle}
              onChange={(val) => updateField('biggestStruggle', val as BiggestStruggle)}
              columns={1}
            />
          </div>
        );

      case 'challenge':
        return (
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <GlassRadioGroup
              options={CHALLENGE_LEVEL_OPTIONS}
              value={formData.challengeLevel}
              onChange={(val) => updateField('challengeLevel', val as ChallengeLevel)}
              columns={1}
            />
          </div>
        );

      case 'goal':
        return (
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar px-2">
            <GlassRadioGroup
              options={PRIMARY_GOAL_OPTIONS}
              value={formData.primaryGoal}
              onChange={(val) => updateField('primaryGoal', val as PrimaryGoal)}
              columns={1}
            />
          </div>
        );

      case 'mustPractice':
        return (
          <GlassTextarea
            placeholder="Type specific questions here (one per line)...&#10;e.g. Tell me about yourself&#10;Why this role?"
            value={rawQuestions}
            onChange={(e) => setRawQuestions(e.target.value)}
            className="min-h-[120px] text-sm"
          />
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
      className={`shrink-0 p-2 rounded-full transition-all duration-200 group ${
        currentStep === 0
          ? 'opacity-0 pointer-events-none'
          : 'hover:bg-white/5 text-gray-500 hover:text-cyan-400'
      }`}
      aria-label="Previous Step"
    >
      <div
        className={`p-3 rounded-full border-2 transition-all duration-300 ${currentStep === 0 ? 'border-gray-800' : 'border-gray-700/50 group-hover:border-cyan-400/50 group-hover:shadow-glow-cyan'}`}
      >
        <ChevronLeft size={32} strokeWidth={1.5} />
      </div>
    </button>
  );

  const renderNextButton = () => (
    <button
      onClick={goNext}
      disabled={!canProceed()}
      className={`shrink-0 p-2 rounded-full transition-all duration-200 group ${
        !canProceed()
          ? 'opacity-30 cursor-not-allowed'
          : 'hover:bg-white/5 text-gray-400 hover:text-cyan-400'
      }`}
      aria-label={isLastStep ? 'Start Session' : 'Next Step'}
    >
      <div
        className={`p-3 rounded-full border-2 transition-all duration-300 ${
          !canProceed()
            ? 'border-gray-800'
            : isLastStep
              ? 'border-cyan-500 bg-cyan-500/10 shadow-glow-cyan animate-pulse group-hover:animate-none'
              : 'border-gray-700/50 group-hover:border-cyan-400/50 group-hover:shadow-glow-cyan'
        }`}
      >
        {isLastStep ? (
          <Play size={32} strokeWidth={1.5} className="ml-1 fill-cyan-400/20" />
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
            <h2 className="text-3xl md:text-6xl font-display font-bold text-zinc-200 mb-6 tracking-tight">
              {step.title}
            </h2>
            <p className="text-lg md:text-xl text-cyan-400 mb-10 max-w-2xl leading-relaxed">
              {step.subtitle}
            </p>
          </motion.div>

          {/* Mobile Start Button (Centered below text) */}
          <div className="md:hidden mt-4">
            <GlassButton
              onClick={goNext}
              className="px-8 py-3 text-lg font-bold shadow-glow-cyan animate-pulse"
            >
              Let's Go <ChevronRight className="ml-2" />
            </GlassButton>
          </div>
        </div>

        <div className="hidden md:block">{renderNextButton()}</div>
      </div>
    );
  }

  // --- Layout 2: Question Cards (Responsive Split View) ---
  return (
    <div className="w-full lg:w-[60vw] h-auto lg:h-[60vh] min-h-[60vh] mx-auto flex flex-col animate-fadeIn relative pb-24 md:pb-0 px-4 md:px-0">
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
            <h2 className="text-2xl md:text-5xl font-display font-bold text-zinc-200 mb-2 tracking-tight">
              {step.title}
            </h2>
            <p className="text-sm md:text-lg text-cyan-400 max-w-3xl mx-auto leading-relaxed px-2">
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
      <div className="fixed md:hidden bottom-0 inset-x-0 p-4 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-between items-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className={`p-3 rounded-full border border-white/10 ${
            currentStep === 0 ? 'opacity-30' : 'active:bg-white/10 text-white'
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
                idx === currentStep ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={!canProceed()}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            !canProceed()
              ? 'bg-white/5 text-gray-500 border border-white/5'
              : isLastStep
                ? 'bg-cyan-500 text-white shadow-glow-cyan'
                : 'bg-white/10 text-white border border-white/20 active:bg-white/20'
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
            className={`h-1 rounded-full transition-all duration-500 ${
              idx === currentStep
                ? 'w-8 bg-cyan-400/80 shadow-glow-cyan'
                : idx < currentStep
                  ? 'w-2 bg-cyan-900/50'
                  : 'w-1 bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
