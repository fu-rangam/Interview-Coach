import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from './useSession';
import { SessionProvider } from '../context/SessionContext';
import * as geminiService from '../services/geminiService';
import { sessionService } from '../services/sessionService';
import { supabase } from '../services/supabase';
import React from 'react';

// Mock services
vi.mock('../services/geminiService', () => ({
    generateQuestions: vi.fn(),
    generateQuestionTips: vi.fn(),
    initSession: vi.fn().mockResolvedValue(null),
    generateBlueprint: vi.fn(),
    generateQuestionPlan: vi.fn(),
    generateSpeech: vi.fn(),
}));

vi.mock('../services/sessionService', () => ({
    sessionService: {
        createSession: vi.fn(),
        getSession: vi.fn(),
        updateSession: vi.fn(),
    },
}));

vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
    },
}));

describe('useSession', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionProvider>{children}</SessionProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should initialize and finish loading', async () => {
        // Initial mount triggers useEffect (getUser)
        const { result } = renderHook(() => useSession(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.session.role).toBe('');
    });

    it('should start a new session as a guest', async () => {
        const mockQuestions = [{ id: '1', text: 'Question 1' }];
        vi.mocked(geminiService.generateQuestions).mockResolvedValue(mockQuestions);

        const { result } = renderHook(() => useSession(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.startSession('Software Engineer', 'Some JD');
        });

        expect(result.current.session.role).toBe('Software Engineer');
        expect(result.current.session.questions).toEqual(mockQuestions);
    });

    it('should navigate between questions', async () => {
        const mockQuestions = [{ id: '1', text: 'Q1' }, { id: '2', text: 'Q2' }];
        vi.mocked(geminiService.generateQuestions).mockResolvedValue(mockQuestions);

        const { result } = renderHook(() => useSession(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.startSession('Engineer');
        });

        act(() => {
            result.current.nextQuestion();
        });
        expect(result.current.session.currentQuestionIndex).toBe(1);

        act(() => {
            result.current.goToQuestion(0);
        });
        expect(result.current.session.currentQuestionIndex).toBe(0);
    });

    it('should save answers', async () => {
        const { result } = renderHook(() => useSession(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const mockAnalysis = {
            transcript: 'My answer',
            feedback: ['Good'],
            rating: 'Strong' as const,
            keyTerms: []
        };

        act(() => {
            result.current.saveAnswer('q1', { text: 'My answer', analysis: mockAnalysis });
        });

        expect(result.current.session.answers['q1'].text).toBe('My answer');
    });

    it('should reset session', async () => {
        const { result } = renderHook(() => useSession(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        vi.mocked(geminiService.generateQuestions).mockResolvedValue([]);
        await act(async () => {
            await result.current.startSession('Engineer');
        });

        act(() => {
            result.current.resetSession();
        });

        expect(result.current.session.role).toBe('');
        expect(localStorage.getItem('current_session')).toBeNull();
    });
});
