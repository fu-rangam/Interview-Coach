import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InterviewSession, AnalysisResult, Question, QuestionTips } from '../types';
import { generateQuestions, generateQuestionTips } from '../services/geminiService';
import { sessionService } from '../services/sessionService';
import { supabase } from '../services/supabase';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'default-session-key';

// Helper: Secure storage wrapper
const secureStorage = {
    getItem: (key: string): InterviewSession | null => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try {
            // Try decrypting first
            const bytes = CryptoJS.AES.decrypt(raw, ENCRYPTION_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error("Decryption failed");
            return JSON.parse(decrypted);
        } catch (e) {
            // Fallback: It might be plain JSON (migration path)
            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }
    },
    setItem: (key: string, value: InterviewSession) => {
        const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString();
        localStorage.setItem(key, ciphertext);
    }
};

interface SessionContextType {
    session: InterviewSession;
    startSession: (role: string, jobDescription?: string) => Promise<void>;
    nextQuestion: () => void;
    goToQuestion: (index: number) => void;
    loadTipsForQuestion: (questionId: string) => Promise<void>;
    saveAnswer: (questionId: string, answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }) => void;
    updateAnswerAnalysis: (questionId: string, partialAnalysis: Partial<AnalysisResult>) => void;
    finishSession: () => Promise<void>;
    resetSession: () => void;
    isLoading: boolean;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Session State
    const [session, setSession] = useState<InterviewSession>(() => {
        const saved = secureStorage.getItem('current_session');
        const defaultSession: InterviewSession = {
            role: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            status: 'IDLE'
        };
        return saved || defaultSession;
    });

    // Persistence State
    const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('current_session_id'));
    const [isGuest, setIsGuest] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Initial Load & Auth Check
    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setIsGuest(!user);

                if (user && sessionId) {
                    // For authenticated users, fetch latest state from server
                    const remoteSession = await sessionService.getSession(sessionId);
                    if (remoteSession) {
                        setSession(remoteSession);
                    }
                }
            } catch (error) {
                console.error("Session restoration failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkUser();
    }, [sessionId]);

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

    const startSession = async (role: string, jobDescription?: string) => {
        // Fetch questions FIRST
        const questions = await generateQuestions(role, jobDescription);

        const newSession: InterviewSession = {
            role,
            jobDescription,
            questions,
            currentQuestionIndex: 0,
            answers: {},
            status: 'ACTIVE'
        };

        setSession(newSession);

        if (isGuest) {
            secureStorage.setItem('current_session', newSession);
        } else {
            // Create remote session for authenticated user
            const newId = await sessionService.createSession(newSession);
            if (newId) {
                setSessionId(newId);
                localStorage.setItem('current_session_id', newId);
                // Clear local legacy session to avoid confusion
                localStorage.removeItem('current_session');
            }
        }
    };

    const nextQuestion = () => {
        setSession(prev => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
    };

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < session.questions.length) {
            setSession(prev => ({
                ...prev,
                currentQuestionIndex: index
            }));
        }
    };

    const loadTipsForQuestion = async (questionId: string) => {
        const question = session.questions.find(q => q.id === questionId);
        if (!question || question.tips) return; // Already loaded or invalid

        try {
            const tips = await generateQuestionTips(question.text, session.role || 'General');
            setSession(prev => ({
                ...prev,
                questions: prev.questions.map(q =>
                    q.id === questionId ? { ...q, tips } : q
                )
            }));
        } catch (error) {
            console.error("Failed to load tips for question:", questionId, error);
        }
    };

    const saveAnswer = (questionId: string, answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }) => {
        setSession(prev => ({
            ...prev,
            answers: { ...prev.answers, [questionId]: answer }
        }));
    };

    const updateAnswerAnalysis = (questionId: string, partialAnalysis: Partial<AnalysisResult>) => {
        setSession(prev => {
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
                            ...partialAnalysis
                        }
                    }
                }
            };
        });
    };

    const finishSession = async () => {
        // Hardening: Verify at least one answer exists before completing
        const hasAnswers = Object.values(session.answers).some(a => a.text || a.audioBlob || a.analysis);
        if (!hasAnswers) {
            console.warn("Attempted to finish session with no answers.");
            return;
        }

        setSession(prev => ({ ...prev, status: 'COMPLETED' }));
        // Force immediate save
        if (isGuest) {
            secureStorage.setItem('current_session', { ...session, status: 'COMPLETED' });
        } else if (sessionId) {
            await sessionService.updateSession(sessionId, { ...session, status: 'COMPLETED' });
        }
    };

    const resetSession = () => {
        const emptySession: InterviewSession = {
            role: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
            status: 'IDLE'
        };
        setSession(emptySession);
        localStorage.removeItem('current_session');
    };

    return (
        <SessionContext.Provider value={{ session, isLoading, startSession, nextQuestion, saveAnswer, resetSession, loadTipsForQuestion, goToQuestion, updateAnswerAnalysis, finishSession }}>
            {children}
        </SessionContext.Provider>
    );
};

// Hook moved to src/hooks/useSessionContext.ts
