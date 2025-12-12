import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InterviewSession, AnalysisResult, Question, QuestionTips } from '../types';
import { generateQuestions, generateQuestionTips } from '../services/geminiService';

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
