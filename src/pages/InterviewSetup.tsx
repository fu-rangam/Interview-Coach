import React, { useState } from 'react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassTextarea } from '../components/ui/glass/GlassTextarea';
import { Upload, FileText, Mic, AlertCircle, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext } from '../hooks/useSessionContext';
import { ResumeUploadZone } from '../components/ResumeUploadZone';
import { IntakeForm } from '../components/IntakeForm';
import { OnboardingIntakeV1, DEFAULT_ONBOARDING_INTAKE_V1 } from '../types/intake';

export const InterviewSetup: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { startSession, resetSession, isLoading } = useSessionContext();
    const [jobDescription, setJobDescription] = useState('');
    // Initialize role from navigation state if available
    const [role, setRole] = useState(location.state?.role || '');
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showIntake, setShowIntake] = useState(false);

    const validateAndContinue = () => {
        if (!jobDescription.trim() || !role.trim()) {
            console.warn("Missing fields");
            setError("Please provide both a Role and Job Description.");
            return;
        }
        setError(null);
        setShowIntake(true);
    };

    const handleStartSession = (intakeData: OnboardingIntakeV1 = DEFAULT_ONBOARDING_INTAKE_V1) => {
        console.log("handleStartSession triggered with intake:", intakeData);

        if (!jobDescription.trim() || !role.trim()) {
            console.warn("Missing fields");
            setError("Please provide both a Role and Job Description.");
            return;
        }

        setIsStarting(true);
        setError(null);

        // Explicitly clear old session data to prevent stale content flash
        resetSession();
        console.log("Session reset, calling startSession...");

        // Start session in background (non-blocking) to allow immediate UI transition
        startSession(role, jobDescription, intakeData)
            .then(() => console.log("startSession completed successfully"))
            .catch(err => {
                console.error("Background session start failed:", err);
                // In a real app, we might want to navigate back or show a global toast error
            });

        // Navigate immediately to show the "Setting Up" loader in InterviewSession
        console.log("Navigating to /interview/session");
        navigate('/interview/session', { state: { isStarting: true } });
    };

    if (showIntake) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <button
                    onClick={() => setShowIntake(false)}
                    className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                    &larr; Back to Role Setup
                </button>
                <IntakeForm
                    onSubmit={handleStartSession}
                    onSkip={() => handleStartSession(DEFAULT_ONBOARDING_INTAKE_V1)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Interview Setup</h1>
                <p className="text-gray-400">Provide the target role and job description for your customized interview.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Briefcase className="text-cyan-400" size={20} />
                            Target Role
                        </h3>
                        <input
                            type="text"
                            placeholder="e.g. Senior Product Manager"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500/50 mb-6"
                        />

                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText className="text-cyan-400" size={20} />
                            Job Description
                        </h3>
                        <div className="relative">
                            <GlassTextarea
                                placeholder="Paste the job description here (e.g., Senior Frontend Engineer at Google...)"
                                className="mb-1 font-mono text-sm min-h-[150px]"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                error={error || undefined}
                                maxLength={3000}
                            />
                            <div className="text-right text-xs text-gray-500 mb-4">
                                {jobDescription.length}/3000
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                                onClick={() => {
                                    setJobDescription("Senior Frontend Engineer needed. Must know React, TypeScript, and TailwindCSS. Experience with system design is a plus.");
                                    setRole("Senior Frontend Engineer");
                                }}
                            >
                                Load Sample JD
                            </button>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Upload className="text-purple-400" size={20} />
                            Upload Resume (Optional)
                        </h3>
                        <ResumeUploadZone />
                    </GlassCard>
                </div>

                {/* Right Column: Summary & Action */}
                <div className="lg:col-span-1">
                    <GlassCard className="sticky top-24 border-t-4 border-t-cyan-500 hidden lg:block">
                        <h3 className="text-lg font-bold mb-4">Session Settings</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Role</span>
                                <div className="text-right">
                                    <span className="font-medium block">{role || 'Not set'}</span>
                                    <button
                                        onClick={() => navigate('/select-role')}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Duration</span>
                                <span className="font-medium">--</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Focus</span>
                                <span className="font-medium">--</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-xs text-red-300">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        <GlassButton
                            className="w-full py-4 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse hover:animate-none uppercase"
                            onClick={validateAndContinue}
                            disabled={isStarting}
                        >
                            <Mic className="mr-2 w-5 h-5" />
                            {isStarting ? 'Generating...' : 'Customize Session'}
                        </GlassButton>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            By starting, you agree to the recording of this session for analysis purposes.
                        </p>
                    </GlassCard>
                </div>
            </div>

            {/* Mobile Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 lg:hidden z-50">
                {error && (
                    <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-300">
                        <AlertCircle size={14} className="shrink-0" />
                        {error}
                    </div>
                )}
                <div className="flex items-center justify-between gap-4">
                    <div className="text-sm">
                        <div className="text-gray-400 text-xs">Target Role</div>
                        <div className="font-bold truncate max-w-[150px]">{role || 'Not set'}</div>
                    </div>
                    <GlassButton
                        className="flex-1 py-3 text-base shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                        onClick={validateAndContinue}
                        disabled={isStarting}
                    >
                        {isStarting ? '...' : 'Customize Session'}
                    </GlassButton>
                </div>
            </div>

            {/* Spacer for mobile footer */}
            <div className="h-24 lg:hidden"></div>
        </div >
    );
};
