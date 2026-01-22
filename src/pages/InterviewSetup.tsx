import React, { useState, useRef } from 'react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassTextarea } from '../components/ui/glass/GlassTextarea';
import { GlassSelect } from '../components/ui/glass/GlassSelect';
import { Upload, FileText, AlertCircle, Briefcase, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext } from '../hooks/useSessionContext';
import { ResumeUploadZone } from '../components/ResumeUploadZone';
import { IntakeForm } from '../components/IntakeForm';
import { OnboardingIntakeV1, DEFAULT_ONBOARDING_INTAKE_V1 } from '../types/intake';
import { SERVICE_ROLES, TECH_ROLES } from '../types';
import { generateCoachPrep, CoachPrepData } from '../services/geminiService';

export const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetSession, isLoading } = useSessionContext();
  const [jobDescription, setJobDescription] = useState('');
  // Initialize role from navigation state if available
  const [role, setRole] = useState(location.state?.role || '');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntake, setShowIntake] = useState(false);

  // Pre-fetched coach prep data
  const coachPrepRef = useRef<CoachPrepData | null>(null);

  const validateAndContinue = () => {
    if (!jobDescription.trim() || !role.trim()) {
      console.warn('Missing fields');
      setError('Please provide both a Role and Job Description.');
      return;
    }
    setError(null);
    setShowIntake(true);

    // Pre-fetch coach prep in background while user fills intake wizard
    generateCoachPrep(role, jobDescription)
      .then((data) => {
        coachPrepRef.current = data;
      })
      .catch((err) => console.warn('[Setup] Coach prep pre-fetch failed:', err));
  };

  const handleStartSession = (intakeData: OnboardingIntakeV1 = DEFAULT_ONBOARDING_INTAKE_V1) => {
    if (!jobDescription.trim() || !role.trim()) {
      console.warn('Missing fields');
      setError('Please provide both a Role and Job Description.');
      return;
    }

    setIsStarting(true);
    setError(null);

    // Clear old session data
    resetSession();

    // Navigate to prep screen - pass pre-fetched data if available
    navigate('/interview/prep', {
      state: {
        role,
        jobDescription,
        intakeData,
        cachedCoachPrep: coachPrepRef.current,
      },
    });
  };

  if (showIntake) {
    return (
      <div className="w-full mx-auto py-8 px-4">
        <button
          onClick={() => setShowIntake(false)}
          className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-1"
        >
          &larr; Back to Role Setup
        </button>
        <IntakeForm onSubmit={handleStartSession} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-40 lg:pb-12 flex flex-col gap-8 h-auto lg:h-[calc(100vh-100px)]">
      <div className="shrink-0 text-center pt-8 lg:pt-0">
        <h1 className="text-3xl font-bold mb-2">Interview Setup</h1>
        <p className="text-gray-400">
          Configure your session by providing a job description or selecting a standard role.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="lg:flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:min-h-0">
        {/* Left: Custom JD Input (Mobile: Fixed Height, Desktop: Full Height) */}
        <div className="flex flex-col gap-4 h-[600px] lg:h-full lg:min-h-0">
          <div className="px-1 shrink-0">
            <h2 className="text-xl font-display font-semibold text-cyan-400">
              Paste a Job Description
            </h2>
            <p className="text-sm text-gray-400">
              Simulate a real interview by pasting a specific job posting here.
            </p>
          </div>

          <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 shrink-0">
              <Briefcase className="text-cyan-400" size={20} />
              Target Role
            </h3>
            <input
              type="text"
              placeholder="e.g. Senior Product Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-cyan-500/50 mb-6 transition-colors shrink-0"
            />

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 shrink-0">
              <FileText className="text-cyan-400" size={20} />
              Job Description
            </h3>
            <div className="relative flex-1 min-h-0 flex flex-col">
              <GlassTextarea
                placeholder="Paste the job description here (e.g., Senior Frontend Engineer at Google...)"
                className="font-mono text-sm flex-1 resize-none h-full custom-scrollbar"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                error={error || undefined}
                maxLength={5000}
              />
              <div className="text-right text-xs text-gray-500 mt-2 shrink-0">
                {jobDescription.length}/5000
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: Stacked Role Selection & Resume (Mobile: Auto Height, Desktop: Full Height) */}
        <div className="flex flex-col gap-8 h-auto lg:h-full lg:min-h-0">
          {/* Top Right: Standard Role */}
          <div className="lg:flex-1 flex flex-col gap-4 lg:min-h-0">
            <div className="px-1 shrink-0">
              <h2 className="text-xl font-display font-semibold text-cyan-400">
                Choose a Standard Role
              </h2>
              <p className="text-sm text-gray-400">
                Quickly start practicing with one of our pre-configured industry roles.
              </p>
            </div>
            <GlassCard className="flex-1 border-t-4 border-t-cyan-500 flex flex-col justify-center p-6 lg:p-6 min-h-[250px] lg:min-h-0">
              <h3 className="text-lg font-bold mb-4">Select a Role</h3>
              <div className="space-y-6">
                <p className="text-sm text-gray-400">
                  Selecting a role below will automatically fill the detailed fields for you.
                </p>
                <GlassSelect
                  value={role}
                  onChange={(newRole) => {
                    setRole(newRole);
                    if (newRole) {
                      setJobDescription(`Standardized job description for ${newRole}`);
                    }
                  }}
                  placeholder="Select a role..."
                  options={[
                    ...SERVICE_ROLES.map((r) => ({
                      value: r,
                      label: r,
                      group: 'Service & Operations',
                    })),
                    ...TECH_ROLES.map((r) => ({
                      value: r,
                      label: r,
                      group: 'Corporate & Technical',
                    })),
                  ]}
                />
              </div>
            </GlassCard>
          </div>

          {/* Bottom Right: Resume Upload */}
          <div className="flex flex-col gap-4 min-h-0 shrink-0">
            <GlassCard className="flex flex-col justify-center p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload className="text-purple-400" size={20} />
                Upload Resume (Optional)
              </h3>
              <div className="flex flex-col justify-center">
                <ResumeUploadZone />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Bottom Actions: Shared Logic */}
      {/* Mobile Fixed Footer */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 flex flex-col gap-3 lg:hidden">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs text-red-300 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <GlassButton
            variant="primary"
            className="w-full h-12 text-sm font-bold shadow-glow-cyan uppercase tracking-wide"
            onClick={validateAndContinue}
            disabled={isStarting}
          >
            {isStarting ? 'Processing...' : 'Personalize Experience'}
          </GlassButton>
          <GlassButton
            variant="default"
            className="w-full h-12 font-medium text-xs text-gray-400 uppercase tracking-wide border-transparent bg-transparent hover:bg-white/5"
            onClick={() => {
              if (!jobDescription.trim() || !role.trim()) {
                setError('Please provide both a Role and Job Description before skipping.');
                return;
              }
              handleStartSession(DEFAULT_ONBOARDING_INTAKE_V1);
            }}
            disabled={isStarting}
          >
            Skip Personalization
          </GlassButton>
        </div>
      </div>

      {/* Desktop Static Footer */}
      <div className="w-full shrink-0 hidden lg:block">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-sm text-red-300 animate-fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Next Button */}
          <GlassButton
            variant="primary"
            className="w-full h-14 text-base font-bold shadow-glow-cyan animate-pulse hover:animate-none uppercase tracking-wide"
            onClick={validateAndContinue}
            disabled={isStarting}
          >
            {isStarting ? 'Processing...' : 'Personalize Experience'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </GlassButton>

          {/* Skip Button */}
          <GlassButton
            variant="default"
            className="w-full h-14 font-medium text-gray-300 hover:text-white uppercase tracking-wide opacity-80 hover:opacity-100"
            onClick={() => {
              if (!jobDescription.trim() || !role.trim()) {
                setError('Please provide both a Role and Job Description before skipping.');
                return;
              }
              handleStartSession(DEFAULT_ONBOARDING_INTAKE_V1);
            }}
            disabled={isStarting}
          >
            Skip Personalization
          </GlassButton>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          By starting, you agree to the recording of this session for analysis purposes.
        </p>
      </div>
    </div>
  );
};
