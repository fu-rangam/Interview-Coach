import React, { useState, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { StandardRoleModal } from '../components/StandardRoleModal';
import { ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext } from '../hooks/useSessionContext';
import { ResumeUploadZone } from '../components/ResumeUploadZone';
import { IntakeForm } from '../components/IntakeForm';
import { OnboardingIntakeV1, DEFAULT_ONBOARDING_INTAKE_V1 } from '../types/intake';
import { generateCoachPrep, CoachPrepData } from '../services/geminiService';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

import { AppBackground } from '../components/AppBackground';

export const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetSession } = useSessionContext();

  // -- State --
  const [role, setRole] = useState(location.state?.role || '');
  const [jobDescription, setJobDescription] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntake, setShowIntake] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStandardRoleSuccess, setShowStandardRoleSuccess] = useState(false);

  // Pre-fetched coach prep data
  const coachPrepRef = useRef<CoachPrepData | null>(null);

  // -- Helpers --

  const handleStandardRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    // Clean "success" toast logic
    setShowStandardRoleSuccess(true);
    setTimeout(() => setShowStandardRoleSuccess(false), 3000);
  };

  const validateAndContinue = () => {
    if (!role.trim()) {
      setError('Please enter a target role to continue.');
      return;
    }
    setError(null);
    setShowIntake(true);

    // Pre-fetch coach prep in background
    // Note: JD is now optional. If empty, we pass empty string.
    generateCoachPrep(role, jobDescription)
      .then((data) => {
        coachPrepRef.current = data;
      })
      .catch((err) => console.warn('[Setup] Coach prep pre-fetch failed:', err));
  };

  const handleStartSession = (intakeData: OnboardingIntakeV1 = DEFAULT_ONBOARDING_INTAKE_V1) => {
    if (!role.trim()) {
      setError('Please enter a target role.');
      return;
    }

    setIsStarting(true);
    setError(null);
    resetSession();

    navigate('/interview/prep', {
      state: {
        role,
        jobDescription,
        intakeData,
        cachedCoachPrep: coachPrepRef.current,
      },
    });
  };

  // -- Render --

  return (
    <div className="min-h-screen pb-20 font-sans relative overflow-hidden">
      {/* Background Atmosphere */}
      <AppBackground />

      <StandardRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectRole={handleStandardRoleSelect}
        currentRoleValue={role}
      />

      <div className="relative z-10 text-slate-900">
        {showIntake ? (
          <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fade-in relative z-10">
            <button
              onClick={() => setShowIntake(false)}
              className="mb-6 text-sm text-slate-500 hover:text-rangam-navy flex items-center gap-2 transition-colors font-medium"
            >
              &larr; Back to Setup
            </button>
            <IntakeForm onSubmit={handleStartSession} />
          </div>
        ) : (
          <main className="max-w-2xl mx-auto px-4 py-12 lg:py-16 relative z-10">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-rangam-navy mb-3">
                Interview Setup
              </h1>
              <p className="text-slate-600 text-lg">
                Configure your session by choosing a role and adding optional details.
              </p>
            </div>

            {/* Main Card */}
            <Card className="p-5 md:p-8 lg:p-10 border-border bg-white/90 shadow-elevation-1 backdrop-blur-sm relative overflow-visible rounded-4xl md:rounded-4xl">
              {/* 1. Target Role (Required) */}
              <section className="mb-8 md:mb-10 relative">
                <div className="flex flex-wrap justify-between items-end gap-x-4 gap-y-2 mb-3">
                  <Label className="uppercase tracking-wider text-rangam-navy flex items-center gap-2 text-sm md:text-base">
                    Target Role
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rangam-orange/10 text-rangam-orange whitespace-nowrap">
                      REQUIRED
                    </span>
                  </Label>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-medium text-rangam-blue hover:text-rangam-blue/80 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Zap size={12} fill="currentColor" />
                    Choose from standard roles
                  </button>
                </div>

                <div className="relative group">
                  <Input
                    type="text"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="e.g., Senior Product Manager"
                    className={cn(
                      'w-full h-12 text-base px-5 border-slate-200',
                      'focus-visible:border-rangam-blue focus-visible:ring-1 focus-visible:ring-rangam-blue focus-visible:ring-offset-0',
                      'hover:border-slate-300 transition-all shadow-sm'
                    )}
                  />
                </div>

                {/* Validation / Success Messages */}
                <div className="min-h-[24px] mt-2">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-red-500 font-medium"
                      >
                        {error}
                      </motion.p>
                    )}
                    {!error && showStandardRoleSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-emerald-600 flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        Target Role updated from standard roles.
                      </motion.p>
                    )}
                    {!error && !showStandardRoleSuccess && !role && (
                      <p className="text-xs text-slate-500">
                        You only need a role to start practicing.
                      </p>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* 2. Job Description (Optional) */}
              <section className="mb-10">
                <div className="flex items-baseline justify-between mb-3">
                  <Label className="uppercase tracking-wider text-rangam-navy flex items-center gap-2">
                    Job Description
                    <span className="text-slate-400 text-[10px] font-normal lowercase">
                      (Optional)
                    </span>
                  </Label>
                </div>

                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className={cn(
                    'w-full h-32 border-slate-200 text-sm resize-none shadow-sm transition-all hover:border-slate-300',
                    'focus-visible:border-rangam-blue focus-visible:ring-1 focus-visible:ring-rangam-blue focus-visible:ring-offset-0'
                  )}
                />
                <p className="text-xs text-slate-500 mt-2">
                  Long descriptions are okay — we’ll summarize it for you.
                </p>
              </section>

              {/* 3. Resume Upload (Optional) */}
              <section className="mb-12">
                <Label className="uppercase tracking-wider text-rangam-navy flex items-center gap-2 mb-4">
                  Resume
                  <span className="text-slate-400 text-[10px] font-normal lowercase">
                    (Optional)
                  </span>
                </Label>

                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 hover:border-rangam-orange/50 transition-colors p-4">
                  <ResumeUploadZone compact />
                </div>
              </section>

              {/* 4. Actions Stack */}
              <section className="flex flex-col gap-4 items-center">
                <div className="w-full relative group">
                  <Button
                    variant="default"
                    onClick={validateAndContinue}
                    disabled={isStarting}
                    className="w-full text-base font-bold uppercase tracking-widest"
                  >
                    {isStarting ? 'Processing...' : 'Personalize Experience'}
                    {!isStarting && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => handleStartSession(DEFAULT_ONBOARDING_INTAKE_V1)}
                  disabled={isStarting}
                  className={cn(
                    'transition-all duration-300 text-slate-500 hover:text-rangam-navy hover:bg-slate-100',
                    isStarting && 'opacity-0 pointer-events-none'
                  )}
                >
                  Skip Personalization
                </Button>
              </section>
            </Card>
          </main>
        )}
      </div>
    </div>
  );
};
