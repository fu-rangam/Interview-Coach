import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InterviewSession, AnalysisResult, Question } from '../types';
import { generateQuestions } from '../services/geminiService';

interface SessionContextType {
    session: InterviewSession;
    startSession: (role: string, jobDescription?: string) => Promise<void>;
    nextQuestion: () => void;
    saveAnswer: (questionId: string, answer: { audioBlob?: Blob; text?: string; analysis: AnalysisResult | null }) => void;
    resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<InterviewSession>(() => {
        const saved = localStorage.getItem('current_session');
        return saved ? JSON.parse(saved) : {
            role: '',
            questions: [],
            currentQuestionIndex: 0,
            answers: {},
        };
    });

    // Persist session changes
    useEffect(() => {
        localStorage.setItem('current_session', JSON.stringify(session));
    }, [session]);

    const startSession = async (role: string, jobDescription?: string) => {
        // Reset first to clear old data
        const newSession = {
            role,
            jobDescription,
            questions: [],
            currentQuestionIndex: 0,
            answers: {}
        };
        setSession(newSession); // Update state immediately

        const questions = await generateQuestions(role, jobDescription);

        setSession(prev => ({
            ...prev,
            questions
        }));
    };

    const nextQuestion = () => {
        setSession(prev => ({
            ...prev,
            currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
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
        <SessionContext.Provider value={{ session, startSession, nextQuestion, saveAnswer, resetSession }}>
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
