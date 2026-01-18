import React, { useState } from 'react';
import { GlassCard } from './ui/glass/GlassCard';
import { GlassButton } from './ui/glass/GlassButton';
import { GlassTextarea } from './ui/glass/GlassTextarea';
import { GlassSelect } from './ui/glass/GlassSelect';
import {
    OnboardingIntakeV1,
    DEFAULT_ONBOARDING_INTAKE_V1,
    BIGGEST_STRUGGLE_OPTIONS,
    CHALLENGE_LEVEL_OPTIONS,
    PRIMARY_GOAL_OPTIONS,
    INTERVIEW_STAGE_OPTIONS,
    STRONG_EXAMPLE_OPTIONS,
    normalizeMustPracticeQuestions,
    ConfidenceScore,
    BiggestStruggle,
    ChallengeLevel,
    PrimaryGoal,
    InterviewStage,
    StrongExamplePreference
} from '../types/intake';
import { Play, SkipForward, HelpCircle, Sliders, Target, Settings, MessageSquare } from 'lucide-react';

// Simple Tooltip wrapper since we don't have a file for it yet and I want to keep this self-contained or I need to create it.
// Actually, let's create a local constrained tooltip for this form to avoid dependency hell if the user didn't ask for a global one yet.
// Re-reading: "drop in tooltip content". I'll make a simple inline tooltip group.

const FieldLabel = ({ label, tooltip }: { label: string; tooltip?: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-300">
            {label}
        </label>
        {tooltip && (
            <div className="group relative">
                <HelpCircle size={14} className="text-gray-500 hover:text-cyan-400 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-black/95 border border-white/10 rounded-lg text-xs shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    {tooltip}
                </div>
            </div>
        )}
    </div>
);

interface IntakeFormProps {
    onSubmit: (data: OnboardingIntakeV1) => void;
    onSkip: () => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, onSkip }) => {
    const [formData, setFormData] = useState<OnboardingIntakeV1>(DEFAULT_ONBOARDING_INTAKE_V1);
    const [rawQuestions, setRawQuestions] = useState('');

    const handleStart = () => {
        const questions = normalizeMustPracticeQuestions(rawQuestions.split('\n'));
        onSubmit({ ...formData, mustPracticeQuestions: questions });
    };

    const updateField = <K extends keyof OnboardingIntakeV1>(key: K, value: OnboardingIntakeV1[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Let’s set you up to win. You're in control.
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    I’m going to ask a few quick questions so this session matches your goals—whether you want a warm-up, realistic practice, or a pressure test.
                </p>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">

                    {/* Section A: Today's Setup */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                            <Sliders className="text-cyan-400" size={20} />
                            Today's Setup
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Confidence */}
                            <div className="space-y-2">
                                <FieldLabel
                                    label="Confidence (1-5)"
                                    tooltip={
                                        <div className="space-y-1 text-center">
                                            <div className="flex justify-between gap-2 text-cyan-400 font-bold">
                                                <span>1 = Anxious</span>
                                                <span>3 = Neutral</span>
                                                <span>5 = Ready</span>
                                            </div>
                                            <div className="text-gray-300 pt-1 border-t border-white/10 mt-1">
                                                Helps me calibrate difficulty.
                                            </div>
                                        </div>
                                    }
                                />
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="1"
                                        value={formData.confidenceScore}
                                        onChange={(e) => updateField('confidenceScore', Number(e.target.value) as ConfidenceScore)}
                                        className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="font-bold text-cyan-400 w-6 text-center">{formData.confidenceScore}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Unsure</span>
                                    <span>Ready</span>
                                </div>
                            </div>

                            {/* Biggest Struggle */}
                            <div>
                                <div className="mb-2">
                                    <FieldLabel
                                        label="Biggest Struggle"
                                        tooltip={
                                            <span className="text-cyan-400 font-medium">
                                                I'll focus questions and feedback on your biggest sticking point.
                                            </span>
                                        }
                                    />
                                </div>
                                <GlassSelect
                                    options={BIGGEST_STRUGGLE_OPTIONS}
                                    value={formData.biggestStruggle}
                                    onChange={(val) => updateField('biggestStruggle', val as BiggestStruggle)}
                                    placeholder="Select a struggle area to work on"
                                />
                            </div>

                            {/* Challenge Level */}
                            <div>
                                <div className="mb-2">
                                    <FieldLabel
                                        label="Challenge Level"
                                        tooltip={
                                            <div className="space-y-1">
                                                <div><span className="text-cyan-400 font-bold">Warm-up</span> <span className="text-gray-300">= confidence building</span></div>
                                                <div><span className="text-cyan-400 font-bold">Realistic</span> <span className="text-gray-300">= normal mode</span></div>
                                                <div><span className="text-cyan-400 font-bold">Pressure test</span> <span className="text-gray-300">= tougher</span></div>
                                            </div>
                                        }
                                    />
                                </div>
                                <GlassSelect
                                    options={CHALLENGE_LEVEL_OPTIONS}
                                    value={formData.challengeLevel}
                                    onChange={(val) => updateField('challengeLevel', val as ChallengeLevel)}
                                />
                                <p className="text-xs text-gray-500 truncate mt-2">
                                    {CHALLENGE_LEVEL_OPTIONS.find(o => o.value === formData.challengeLevel)?.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section B: Goals */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                            <Target className="text-cyan-400" size={20} />
                            Goals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="mb-2">
                                    <FieldLabel
                                        label="Main Goal"
                                        tooltip={
                                            <span className="text-cyan-400 font-medium">
                                                I'll adjust question types and feedback to match what you're trying to improve.
                                            </span>
                                        }
                                    />
                                </div>
                                <GlassSelect
                                    options={PRIMARY_GOAL_OPTIONS}
                                    value={formData.primaryGoal}
                                    onChange={(val) => updateField('primaryGoal', val as PrimaryGoal)}
                                />
                            </div>
                            <div>
                                <div className="mb-2">
                                    <FieldLabel
                                        label="Interview Stage"
                                        tooltip={
                                            <div className="space-y-1">
                                                <div><span className="text-cyan-400 font-bold">Recruiter</span> <span className="text-gray-300">= broad</span></div>
                                                <div><span className="text-cyan-400 font-bold">Hiring Manager</span> <span className="text-gray-300">= execution</span></div>
                                                <div><span className="text-cyan-400 font-bold">Panel</span> <span className="text-gray-300">= tough</span></div>
                                            </div>
                                        }
                                    />
                                </div>
                                <GlassSelect
                                    options={INTERVIEW_STAGE_OPTIONS}
                                    value={formData.stage}
                                    onChange={(val) => updateField('stage', val as InterviewStage)}
                                    placeholder="Select a stage"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section C: Preferences */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                            <Settings className="text-cyan-400" size={20} />
                            Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="block text-sm font-medium text-gray-200">Enable Follow-ups</span>
                                        <div className="group relative">
                                            <HelpCircle size={14} className="text-gray-500 hover:text-cyan-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-xs text-gray-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                                <span className="text-cyan-400 font-medium">
                                                    If your answer is missing detail, I'll ask one quick push question like a real interviewer.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">Like a real interviewer pushing for detail</span>
                                </div>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="toggle"
                                        id="toggle"
                                        checked={formData.allowFollowUps}
                                        onChange={(e) => updateField('allowFollowUps', e.target.checked)}
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-5 transition-all duration-300"
                                    />
                                    <label
                                        htmlFor="toggle"
                                        className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-300 ${formData.allowFollowUps ? 'bg-cyan-500' : 'bg-gray-700'}`}
                                    ></label>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2">
                                    <FieldLabel
                                        label="Show Strong Examples"
                                        tooltip={
                                            <span className="text-cyan-400 font-medium">
                                                I'll show one when you need it, so you learn without memorizing scripts.
                                            </span>
                                        }
                                    />
                                </div>
                                <GlassSelect
                                    options={STRONG_EXAMPLE_OPTIONS}
                                    value={formData.includeStrongExamples}
                                    onChange={(val) => updateField('includeStrongExamples', val as StrongExamplePreference)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section D: Optional Focus */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                            <MessageSquare className="text-cyan-400" size={20} />
                            Must-Practice Questions <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Optional</span>
                            <div className="group relative">
                                <HelpCircle size={14} className="text-gray-500 hover:text-cyan-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-xs text-gray-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                    <span className="text-cyan-400 font-medium">
                                        One per line. I'll include them naturally in your session.
                                    </span>
                                </div>
                            </div>
                        </h3>
                        <GlassTextarea
                            placeholder="Type specific questions here (one per line)...&#10;e.g. Tell me about yourself&#10;Why this role?"
                            value={rawQuestions}
                            onChange={(e) => setRawQuestions(e.target.value)}
                            className="min-h-[100px] text-sm"
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-black/20 border-t border-white/5 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
                    <button
                        onClick={onSkip}
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors px-4 py-2"
                    >
                        <SkipForward size={16} />
                        Skip Customization
                    </button>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <span className="text-xs text-gray-500 hidden md:inline">You can change these settings later</span>
                        <GlassButton
                            onClick={handleStart}
                            className="w-full md:w-auto bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none shadow-lg shadow-cyan-900/20"
                            // Disable start if required fields are empty
                            disabled={!formData.biggestStruggle || !formData.stage}
                        >
                            <Play size={18} className="mr-2 fill-current" />
                            Start Customized Session
                        </GlassButton>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
