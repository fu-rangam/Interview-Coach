import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { OnboardingIntakeV1 } from '../types/intake';
import { InterviewSession, AnalysisResult, Question, QuestionPlanItem } from '../types';
import {
  generateQuestions,
  generateQuestionTips,
  generateBlueprint,
  generateSpeech,
  initSession,
} from '../services/geminiService';
import { sessionService } from '../services/sessionService';
import { supabase } from '../services/supabase';
import { secureStorage } from '../utils/encryption';

export interface SessionContextType {
  session: InterviewSession;
  startSession: (
    role: string,
    jobDescription?: string,
    intakeData?: OnboardingIntakeV1
  ) => Promise<void>;
  nextQuestion: () => void;
  goToQuestion: (index: number) => void;
  loadTipsForQuestion: (questionId: string) => Promise<void>;
  saveAnswer: (
    questionId: string,
    answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }
  ) => void;
  clearAnswer: (questionId: string) => void;
  updateAnswerAnalysis: (questionId: string, partialAnalysis: Partial<AnalysisResult>) => void;
  finishSession: () => Promise<void>;
  resetSession: () => void;
  isLoading: boolean;
  audioUrls: Record<string, string>;
  cacheAudioUrl: (questionId: string, url: string) => void;
  updateSession: (sessionId: string, updates: Partial<InterviewSession>) => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Session State
  const [session, setSession] = useState<InterviewSession>(() => {
    const saved = secureStorage.getItem<InterviewSession>('current_session');
    const defaultSession: InterviewSession = {
      id: 'default',
      role: '',
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      status: 'IDLE',
    };
    return saved || defaultSession;
  });

  // Persistence State
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('current_session_id')
  );
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Audio Cache State (Blob URLs are ephemeral, so we keep them in memory only)
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  // Track active URLs for cleanup
  const activeObjectUrls = React.useRef<Set<string>>(new Set());

  const revokeAllAudio = useCallback(() => {
    activeObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activeObjectUrls.current.clear();
  }, []);

  const trackAudioUrl = useCallback((url: string) => {
    activeObjectUrls.current.add(url);
    return url;
  }, []);

  const cacheAudioUrl = useCallback((questionId: string, url: string) => {
    // If we cache it here, we should track it too if it's new, but typically
    // it comes from trackAudioUrl usage upstream.
    // However, to be safe, we just set it.
    setAudioUrls((prev) => ({ ...prev, [questionId]: url }));
  }, []);

  // Initial Load & Auth Check
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsGuest(!user);

        if (user && sessionId) {
          // For authenticated users, fetch latest state from server
          const remoteSession = await sessionService.getSession(sessionId);
          if (remoteSession) {
            setSession(remoteSession);
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();

    // Cleanup on unmount
    return () => {
      revokeAllAudio();
    };
  }, [sessionId, revokeAllAudio]);

  // Persist session changes (Debounced for remote)
  useEffect(() => {
    const saveSession = async () => {
      if (isGuest) {
        // HARDENING: Encrypt active session at rest
        secureStorage.setItem('current_session', session);
      } else if (sessionId) {
        await sessionService.updateSession(sessionId, session);
      }
    };

    const timeout = setTimeout(saveSession, 1000); // 1s debounce
    return () => clearTimeout(timeout);
  }, [session, isGuest, sessionId]);

  // OPTIMIZATION: Sequential Pre-fetching (Next Question)
  useEffect(() => {
    const preFetchNextAudio = async () => {
      const nextIndex = session.currentQuestionIndex + 1;
      if (nextIndex < session.questions.length) {
        const nextQuestion = session.questions[nextIndex];

        // Debug Log
        console.log(`[Session] Checking pre-fetch for Q${nextIndex + 1}:`, {
          text: !!nextQuestion?.text,
          isLoading: nextQuestion?.isLoading,
        });

        // Pre-fetch Next Question Audio (if not already cached)
        if (nextQuestion && nextQuestion.text && !nextQuestion.isLoading) {
          if (audioUrls[nextQuestion.id]) {
            console.log(
              `[Session] ⏭️ Audio for Q${nextIndex + 1} already cached. Skipping pre-fetch.`
            );
          } else {
            console.log(`[Session] 🔊 Triggering pre-fetch for Q${nextIndex + 1}`);
            generateSpeech(nextQuestion.text)
              .then((url) => {
                if (url) {
                  const tracked = trackAudioUrl(url);
                  setAudioUrls((prev) => ({ ...prev, [nextQuestion.id]: tracked }));
                }
              })
              .catch((e) => console.warn('Background audio fetch failed', e));
          }
        }
      }
    };
    preFetchNextAudio();
  }, [session.currentQuestionIndex, session.questions, audioUrls, trackAudioUrl]);

  const startSession = useCallback(
    async (role: string, jobDescription?: string, intakeData?: OnboardingIntakeV1) => {
      setIsLoading(true);
      revokeAllAudio(); // Clear previous session audio data
      setAudioUrls({}); // Clear audio cache for new session
      try {
        console.log('Initializing Session (Unified - Final Attempt)...');

        // 1. Unified Call
        const initData = await initSession(role, jobDescription, intakeData);

        let blueprint = null;
        let questionPlan = null;
        let firstBatch: Question[] = [];

        if (initData) {
          blueprint = initData.blueprint;
          questionPlan = initData.questionPlan;

          // Handle First Question
          if (initData.firstQuestion) {
            const planQ1 = questionPlan?.questions[0];
            firstBatch = [
              {
                ...initData.firstQuestion,
                competencyId: planQ1?.competencyId,
                type: planQ1?.type,
                difficulty: planQ1?.difficulty,
                intent: planQ1?.intent,
              },
            ];

            // OPTIMIZATION: Pre-fetch audio immediately
            if (initData.firstQuestion && audioUrls[initData.firstQuestion.id]) {
              console.log(`[Session] ⏭️ Audio for Q1 already cached. Skipping pre-fetch.`);
            } else {
              console.log(`[Session] 🔊 Triggering pre-fetch for Q1`);
              generateSpeech(initData.firstQuestion.text)
                .then((url) => {
                  if (url && initData.firstQuestion) {
                    const tracked = trackAudioUrl(url);
                    setAudioUrls((prev) => ({ ...prev, [initData.firstQuestion!.id]: tracked }));
                  }
                })
                .catch((e) => console.warn('Audio pre-fetch failed', e));
            }
          } else if (initData.questions && initData.questions.length > 0) {
            firstBatch = [initData.questions[0]];
          }
        } else {
          console.warn('Unified Init failed. Falling back to specific generation...');
          const [questions, generatedBlueprint] = await Promise.all([
            generateQuestions(role, jobDescription),
            generateBlueprint(role, jobDescription),
          ]);
          firstBatch = questions;
          blueprint = generatedBlueprint;
        }

        // 2. Prepare Question List with Placeholders
        let initialQuestions = [...firstBatch];

        if (questionPlan && questionPlan.questions.length > 1) {
          const placeholders = questionPlan.questions.slice(1).map(
            (p: QuestionPlanItem, idx: number) =>
              ({
                id: `pending-${idx + 1}`,
                text: 'Analyzing job requirements...',
                type: p.type,
                competencyId: p.competencyId,
                difficulty: p.difficulty,
                isLoading: true,
              }) as Question
          );
          initialQuestions = [...initialQuestions, ...placeholders];
        }

        const newSession: InterviewSession = {
          id:
            typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role,
          jobDescription,
          questions: initialQuestions,
          currentQuestionIndex: 0,
          answers: {},
          status: 'ACTIVE',
          blueprint: blueprint || undefined,
          intakeData: intakeData, // Persist intake data for context
        };

        setSession(newSession);
        setIsLoading(false); // Immediate UI Entry

        // 3. Background Fetch for Remaining Questions
        if (questionPlan && questionPlan.questions.length > 1) {
          const remainingIndices = questionPlan.questions
            .map((_: unknown, i: number) => i)
            .slice(1);
          console.log('Fetching remaining questions in background...', remainingIndices);

          generateQuestions(
            role,
            jobDescription,
            questionPlan || undefined,
            blueprint || undefined,
            remainingIndices,
            intakeData // Pass intake data for tone context
          )
            .then((remainingQuestions) => {
              setSession((prev) => {
                const updatedQuestions = [...prev.questions];
                remainingQuestions.forEach((q, i) => {
                  const params = questionPlan!.questions[remainingIndices[i]];
                  updatedQuestions[remainingIndices[i]] = {
                    ...q,
                    competencyId: params.competencyId,
                    type: params.type,
                    difficulty: params.difficulty,
                    isLoading: false,
                  };
                });

                // Background persistence for guest
                if (isGuest) {
                  secureStorage.setItem('current_session', {
                    ...prev,
                    questions: updatedQuestions,
                  });
                }
                return { ...prev, questions: updatedQuestions };
              });
            })
            .catch((err) => console.error('Background fetch failed', err));
        }

        // 4. Async Persistence Creation
        if (isGuest) {
          secureStorage.setItem('current_session', newSession);
        } else {
          sessionService.createSession(newSession).then((newId) => {
            if (newId) {
              setSessionId(newId);
              localStorage.setItem('current_session_id', newId);
              localStorage.removeItem('current_session');
            }
          });
        }
      } catch (error) {
        console.error('Failed to start session:', error);
        // Optionally set an error state in session
        setIsLoading(false);
        // Alert for mobile debugging
        if (window.innerWidth < 768) {
          console.error(
            'Mobile Session Start Error Details:',
            JSON.stringify(error, Object.getOwnPropertyNames(error))
          );
        }
      }
    },
    [audioUrls, isGuest, revokeAllAudio, trackAudioUrl]
  );

  const nextQuestion = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
    }));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setSession((prev) => {
      if (index >= 0 && index < prev.questions.length) {
        return {
          ...prev,
          currentQuestionIndex: index,
        };
      }
      return prev;
    });
  }, []);

  const loadTipsForQuestion = useCallback(
    async (questionId: string) => {
      const question = session.questions.find((q) => q.id === questionId);
      if (!question || question.tips) return; // Already loaded or invalid

      try {
        const competency = session.blueprint?.competencies.find(
          (c) => c.id === question.competencyId
        );
        const tips = await generateQuestionTips(
          question.text,
          session.role || 'General',
          competency,
          session.intakeData,
          session.blueprint
        );
        setSession((prev) => ({
          ...prev,
          questions: prev.questions.map((q) => (q.id === questionId ? { ...q, tips } : q)),
        }));
      } catch (error) {
        console.error('Failed to load tips for question:', questionId, error);
      }
    },
    [session.blueprint, session.intakeData, session.questions, session.role]
  );

  const saveAnswer = useCallback(
    (
      questionId: string,
      answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }
    ) => {
      setSession((prev) => ({
        ...prev,
        answers: { ...prev.answers, [questionId]: answer },
      }));
    },
    []
  );

  const clearAnswer = useCallback((questionId: string) => {
    setSession((prev) => {
      const newAnswers = { ...prev.answers };
      delete newAnswers[questionId];
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const updateAnswerAnalysis = useCallback(
    (questionId: string, partialAnalysis: Partial<AnalysisResult>) => {
      setSession((prev) => {
        const currentAnswer = prev.answers[questionId];
        if (!currentAnswer || !currentAnswer.analysis) return prev; // Can't update if doesn't exist

        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: {
              ...currentAnswer,
              analysis: {
                ...currentAnswer.analysis,
                ...partialAnalysis,
              },
            },
          },
        };
      });
    },
    []
  );

  const finishSession = useCallback(async () => {
    // Hardening: Verify at least one answer exists before completing
    const hasAnswers = Object.values(session.answers).some(
      (a) => a.text || a.audioBlob || a.analysis
    );
    if (!hasAnswers) {
      console.warn('Attempted to finish session with no answers.');
      return;
    }

    setSession((prev) => ({ ...prev, status: 'COMPLETED' }));
    // Force immediate save
    if (isGuest) {
      secureStorage.setItem('current_session', { ...session, status: 'COMPLETED' });
    } else if (sessionId) {
      await sessionService.updateSession(sessionId, { ...session, status: 'COMPLETED' });
    }
  }, [session, isGuest, sessionId]);

  const resetSession = useCallback(() => {
    const emptySession: InterviewSession = {
      id: `reset-${Date.now()}`,
      role: '',
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      status: 'IDLE',
    };
    setSession(emptySession);
    revokeAllAudio(); // Clear previous session audio data
    setAudioUrls({}); // Clear audio cache
    localStorage.removeItem('current_session');
  }, [revokeAllAudio]);

  const updateSession = useCallback(
    async (sessionId: string, updates: Partial<InterviewSession>) => {
      setSession((prev) => ({ ...prev, ...updates }));
      if (!isGuest) {
        await sessionService.updateSession(sessionId, { ...session, ...updates });
      }
    },
    [session, isGuest]
  );

  const contextValue = React.useMemo(
    () => ({
      session,
      isLoading,
      audioUrls,
      startSession,
      nextQuestion,
      goToQuestion,
      loadTipsForQuestion,
      saveAnswer,
      clearAnswer,
      updateAnswerAnalysis,
      cacheAudioUrl,
      finishSession,
      resetSession,
      updateSession,
    }),
    [
      session,
      isLoading,
      audioUrls,
      startSession,
      nextQuestion,
      goToQuestion,
      loadTipsForQuestion,
      saveAnswer,
      clearAnswer,
      updateAnswerAnalysis,
      cacheAudioUrl,
      finishSession,
      resetSession,
      updateSession,
    ]
  );

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};
