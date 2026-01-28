import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CoachPrepScreen } from '../components/CoachPrepScreen';
import { generateCoachPrep, CoachPrepData } from '../services/geminiService';
import { useSessionContext } from '../hooks/useSessionContext';
import { OnboardingIntakeV1 } from '../types/intake';

interface LocationState {
  role: string;
  jobDescription?: string;
  intakeData?: OnboardingIntakeV1;
  cachedCoachPrep?: CoachPrepData | null;
}

export const InterviewPrep: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startSession, session } = useSessionContext();

  const state = location.state as LocationState | null;
  const role = state?.role || '';
  const jobDescription = state?.jobDescription;
  const intakeData = state?.intakeData;
  const cachedCoachPrep = state?.cachedCoachPrep;

  const [prepData, setPrepData] = useState<CoachPrepData | null>(cachedCoachPrep || null);
  const [isPrepLoading, setIsPrepLoading] = useState(!cachedCoachPrep);
  const [localSessionLoaded, setLocalSessionLoaded] = useState(false);

  // Guard: Redirect if no role provided
  useEffect(() => {
    // Ensure we start at the top (fixes scroll retention from Setup page)
    window.scrollTo(0, 0);

    if (!role) {
      navigate('/interview/setup');
    }
  }, [role, navigate]);

  const hasStartedRef = React.useRef(false);

  // Parallel: Fetch coach prep (only if not cached) and start session (slow)
  useEffect(() => {
    if (!role) return;
    if (hasStartedRef.current) return; // Prevent double-fire or dependency-driven re-fire

    hasStartedRef.current = true;

    // Only fetch coach prep if not already cached
    if (!cachedCoachPrep) {
      generateCoachPrep(role, jobDescription)
        .then((data) => {
          setPrepData(data);
          setIsPrepLoading(false);
        })
        .catch((err) => {
          console.error('Coach prep failed:', err);
          setIsPrepLoading(false);
        });
    }

    // Slow: Full session init (background)
    startSession(role, jobDescription, intakeData)
      .then(() => {
        setLocalSessionLoaded(true);
      })
      .catch((err) => {
        console.error('Session init failed:', err);
        // Still allow navigation - session might partially work
        setLocalSessionLoaded(true);
      });
  }, [role, jobDescription, intakeData, startSession, cachedCoachPrep]);

  // Derived state: Ready if local load finished OR context already has active session
  const isSessionReady =
    localSessionLoaded || (session.status === 'ACTIVE' && session.questions.length > 0);

  const handleBegin = () => {
    navigate('/interview/session');
  };

  const handleRetry = () => {
    setIsPrepLoading(true);
    generateCoachPrep(role, jobDescription)
      .then((data) => {
        setPrepData(data);
        setIsPrepLoading(false);
      })
      .catch((err) => {
        console.error('Coach prep retry failed:', err);
        setIsPrepLoading(false);
      });
  };

  return (
    <CoachPrepScreen
      prepData={prepData}
      isLoading={isPrepLoading}
      isSessionReady={isSessionReady}
      onBegin={handleBegin}
      onRetry={handleRetry}
      role={role}
    />
  );
};
