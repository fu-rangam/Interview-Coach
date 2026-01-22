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
        subtitle: "I'm going to ask a few quick questions so this session matches your goals—whether you want a warm-up, realistic practice, or a tougher challenge. Ready? Let's go."
    },
    {
        id: 'stage',
        title: "What stage are you preparing for?",
        subtitle: "First, tell me where you are in the process. A recruiter screen is more about fit and basics, while a panel or final round gets into deeper territory. I'll adjust accordingly."
    },
    {
        id: 'confidence',
        title: "How are you feeling right now?",
        subtitle: "Be honest—are you feeling anxious (1), neutral (3), or completely ready (5)? This helps me calibrate the difficulty so we build momentum, not overwhelm you."
    },
    {
        id: 'struggle',
        title: "What's your biggest sticking point?",
        subtitle: "Everyone has something they want to work on. Pick your biggest struggle and I'll focus questions and feedback on that area."
    },
    {
        id: 'challenge',
        title: "How challenging should the session be?",
        subtitle: "Warm-up is confidence building—I'll go easy. Realistic is normal interview mode. Challenge Mode? I'll throw curveballs and push for depth. Your call."
    },
    {
        id: 'goal',
        title: "What's your primary goal this session?",
        subtitle: "Are you trying to get more structured, work on conciseness, practice STAR stories, or something else? I'll tailor my feedback to match."
    },
    {
        id: 'mustPractice',
        title: "Any specific questions to include?",
        subtitle: "If there are questions you know are coming—or ones you dread—type them here (one per line). I'll make sure we cover them. This is optional, so feel free to skip if you're not sure."
    }
];

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit }) => {
    const [formData, setFormData] = useState<OnboardingIntakeV1>(DEFAULT_ONBOARDING_INTAKE_V1);
    const [rawQuestions, setRawQuestions] = useState('');
    const [currentStep, setCurrentStep] = useState(0);

    const handleStart = () => {
        const questions = normalizeMustPracticeQuestions(rawQuestions.split('\n'));
        onSubmit({ ...formData, mustPracticeQuestions: questions });
    };

    const updateField = <K extends keyof OnboardingIntakeV1>(key: K, value: OnboardingIntakeV1[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const goNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleStart();
        }
    };

    const goPrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
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
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <span className="font-bold text-cyan-700 text-2xl">
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
                                onChange={(e) => updateField('confidenceScore', Number(e.target.value) as ConfidenceScore)}
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
            className={`shrink-0 p-2 rounded-full transition-all duration-200 group ${currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'hover:bg-white/5 text-gray-500 hover:text-cyan-400'
                }`}
            aria-label="Previous Step"
        >
            <div className={`p-3 rounded-full border-2 transition-all duration-300 ${currentStep === 0 ? 'border-gray-800' : 'border-gray-700/50 group-hover:border-cyan-400/50 group-hover:shadow-glow-cyan'}`}>
                <ChevronLeft size={32} strokeWidth={1.5} />
            </div>
        </button>
    );

    const renderNextButton = () => (
        <button
            onClick={goNext}
            disabled={!canProceed()}
            className={`shrink-0 p-2 rounded-full transition-all duration-200 group ${!canProceed()
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-white/5 text-gray-400 hover:text-cyan-400'
                }`}
            aria-label={isLastStep ? "Start Session" : "Next Step"}
        >
            <div className={`p-3 rounded-full border-2 transition-all duration-300 ${!canProceed()
                ? 'border-gray-800'
                : isLastStep
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-glow-cyan animate-pulse group-hover:animate-none'
                    : 'border-gray-700/50 group-hover:border-cyan-400/50 group-hover:shadow-glow-cyan'
                }`}>
                {isLastStep ? (
                    <Play size={32} strokeWidth={1.5} className="ml-1 fill-cyan-400/20" />
                ) : (
                    <ChevronRight size={32} strokeWidth={1.5} />
                )}
            </div>
        </button>
    );

    // --- Layout 1: Intro Card (Original Centered Layout) ---
    if (step.id === 'intro') {
        return (
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4 animate-fadeIn min-h-[500px]">
                {/* Prev (Hidden but keeps spacing if needed, though intro usually has none. keeping for consistency) */}
                {renderPrevButton()}

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-4xl flex flex-col items-center text-center"
                    >
                        <h2 className="text-5xl md:text-6xl font-display font-bold text-zinc-200 mb-6 tracking-tight">
                            {step.title}
                        </h2>
                        <p className="text-xl text-cyan-400 mb-10 max-w-2xl leading-relaxed">
                            {step.subtitle}
                        </p>
                    </motion.div>
                </div>

                {renderNextButton()}
            </div>
        );
    }

    // --- Layout 2: Question Cards (Split 50% Page View) ---
    // User Request: 50% of page dimension, Centered.
    // Top Card: Title/Subtitle. Bottom Card: Content + Arrows vertically centered.
    return (
        <div className="w-[80vw] lg:w-[60vw] h-[70vh] lg:h-[60vh] mx-auto flex flex-col animate-fadeIn">  {/* Using 60vw/60vh as a safe "50% page" approximation that is distinct */}

            {/* Top Nested "Invisible" Card: Title & Subtitle */}
            <div className="w-full shrink-0 flex flex-col items-center text-center mb-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-zinc-200 mb-2 tracking-tight">
                            {step.title}
                        </h2>
                        <p className="text-lg text-cyan-400 max-w-3xl mx-auto leading-relaxed">
                            {step.subtitle}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Nested "Invisible" Card: Content + Navigation */}
            <div className="flex-1 min-h-0 flex items-center gap-4 w-full">

                {/* Left Arrow (Vertically centered relative to this bottom section) */}
                {renderPrevButton()}

                {/* Scrollable Content Area */}
                <div className="flex-1 h-full min-h-0 relative flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`content-${currentStep}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full flex flex-col justify-center"
                        >
                            {/* We assume renderStepContent manages its own scrolling now, or we wrap it here */}
                            {/* The renderStepContent already has max-h wrappers, we might need to adjust them to fit 'h-full' */}
                            <div className="w-full max-w-5xl mx-auto">
                                {renderStepContent()}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right Arrow */}
                {renderNextButton()}
            </div>

            {/* Progress Bar (Optional: Putting it at the very bottom or top of everything? Keeping it minimal/hidden for now or could place it at bottom edge) */}
            <div className="flex justify-center gap-2 mt-4 shrink-0">
                {STEPS.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-500 ${idx === currentStep
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
