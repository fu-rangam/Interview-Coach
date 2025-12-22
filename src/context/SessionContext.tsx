import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InterviewSession, AnalysisResult, Question, QuestionTips } from '../types';
import { generateQuestions, generateQuestionTips } from '../services/geminiService';
import { sessionService } from '../services/sessionService';
import { supabase } from '../services/supabase';

interface SessionContextType {
    session: InterviewSession;
    startSession: (role: string, jobDescription?: string) => Promise<void>;
    nextQuestion: () => void;
    goToQuestion: (index: number) => void;
    loadTipsForQuestion: (questionId: string) => Promise<void>;
    saveAnswer: (questionId: string, answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }) => void;
    resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Session State
    const [session, setSession] = useState<InterviewSession>(() => {
        const saved = localStorage.getItem('current_session');
        const defaultSession: InterviewSession = {
            role: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
        };
        return saved ? JSON.parse(saved) : defaultSession;
    });

    // Persistence State
    const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('current_session_id'));
    const [isGuest, setIsGuest] = useState<boolean>(true);

    // Initial Load & Auth Check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setIsGuest(!user);

            if (user && sessionId) {
                // For authenticated users, fetch latest state from server
                const remoteSession = await sessionService.getSession(sessionId);
                if (remoteSession) {
                    setSession(remoteSession);
                }
            }
        };
        checkUser();
    }, [sessionId]);

    // Persist session changes (Debounced for remote)
    useEffect(() => {
        const saveSession = async () => {
            if (isGuest) {
                localStorage.setItem('current_session', JSON.stringify(session));
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

        const newSession = {
            role,
            jobDescription,
            questions,
            currentQuestionIndex: 0,
            answers: {}
        };

        setSession(newSession);

        if (isGuest) {
            localStorage.setItem('current_session', JSON.stringify(newSession));
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

    const resetSession = () => {
        const emptySession = {
            role: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {}
        };
        setSession(emptySession);
        localStorage.removeItem('current_session');
    };

    return (
        <SessionContext.Provider value={{ session, startSession, nextQuestion, saveAnswer, resetSession, loadTipsForQuestion, goToQuestion }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
};
