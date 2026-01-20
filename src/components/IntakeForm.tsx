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
        subtitle: "I'm going to ask a few quick questions so this session matches your goals—whether you want a warm-up, realistic practice, or a pressure test. Ready? Let's go."
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
        title: "How hard should I push you?",
        subtitle: "Warm-up is confidence building—I'll go easy. Realistic is normal interview mode. Pressure test? I'll throw curveballs and push for depth. Your call."
    },
    {
        id: 'goal',
        title: "What's your main goal today?",
        subtitle: "Are you trying to get more structured, work on conciseness, practice STAR stories, or something else? I'll tailor my feedback to match."
    },
    {
        id: 'mustPractice',
        title: "Any specific questions you want to include?",
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
                    <GlassRadioGroup
                        options={INTERVIEW_STAGE_OPTIONS}
                        value={formData.stage}
                        onChange={(val) => updateField('stage', val as InterviewStage)}
                    />
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
                            />
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>😰 Anxious</span>
                            <span>😐 Neutral</span>
                            <span>💪 Ready</span>
                        </div>
                    </div>
                );

            case 'struggle':
                return (
                    <GlassRadioGroup
                        options={BIGGEST_STRUGGLE_OPTIONS}
                        value={formData.biggestStruggle}
                        onChange={(val) => updateField('biggestStruggle', val as BiggestStruggle)}
                    />
                );

            case 'challenge':
                return (
                    <div className="space-y-3">
                        <GlassRadioGroup
                            options={CHALLENGE_LEVEL_OPTIONS}
                            value={formData.challengeLevel}
                            onChange={(val) => updateField('challengeLevel', val as ChallengeLevel)}
                        />
                        <p className="text-sm text-gray-400 text-center">
                            {CHALLENGE_LEVEL_OPTIONS.find(o => o.value === formData.challengeLevel)?.description}
                        </p>
                    </div>
                );

            case 'goal':
                return (
                    <GlassRadioGroup
                        options={PRIMARY_GOAL_OPTIONS}
                        value={formData.primaryGoal}
                        onChange={(val) => updateField('primaryGoal', val as PrimaryGoal)}
                    />
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

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <GlassCard className="p-0">
                <div className="p-6 md:p-10">
                    {/* Progress indicator */}
                    <div className="flex justify-center gap-1.5 mb-8">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                                    ? 'w-8 bg-cyan-400'
                                    : idx < currentStep
                                        ? 'w-4 bg-cyan-600'
                                        : 'w-4 bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Step content with animation */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="min-h-[200px] flex flex-col"
                        >
                            {/* Title */}
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
                                {step.title}
                            </h2>

                            {/* Subtitle / Coach narrative */}
                            <p className="text-gray-400 text-center mb-8 max-w-lg mx-auto leading-relaxed">
                                {step.subtitle}
                            </p>

                            {/* Input field */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-full">
                                    {renderStepContent()}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation footer */}
                <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
                    {/* Previous button */}
                    <button
                        onClick={goPrev}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${currentStep === 0
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </button>

                    {/* Next / Start button */}
                    <GlassButton
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-lg shadow-cyan-900/20 whitespace-nowrap"
                    >
                        {isLastStep ? (
                            <>
                                <Play size={18} className="mr-2 fill-current" />
                                Start Session
                            </>
                        ) : (
                            <>
                                Next
                                <ChevronRight size={18} className="ml-1" />
                            </>
                        )}
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};
