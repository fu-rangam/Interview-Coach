import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterviewSession } from './InterviewSession';
import { SessionContext, SessionContextType } from '../context/SessionContext';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// --- MOCKS ---

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.URL.createObjectURL = vi.fn(() => 'mock-url');

// Mock SessionLoader (initial loader)
vi.mock('../components/ui/session-loader', () => ({
  SessionLoader: ({ onTransitionComplete }: { onTransitionComplete: () => void }) => {
    React.useEffect(() => {
      onTransitionComplete();
    }, [onTransitionComplete]);
    return <div data-testid="session-loader">Loader</div>;
  },
}));

// Mock MultiStepLoader
vi.mock('../components/ui/multi-step-loader', () => ({
  MultiStepLoader: ({ loading, onComplete }: { loading: boolean; onComplete: () => void }) => {
    React.useEffect(() => {
      if (loading && onComplete) {
        // Must allow time for checking "loading" state in assertions
        const timer = setTimeout(() => {
          onComplete();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [loading, onComplete]);
    return loading ? <div data-testid="multistep-loader">MultiStepLoader</div> : null;
  },
}));

// Mock FeedbackModal
vi.mock('../components/FeedbackModal', () => ({
  FeedbackModal: ({ isOpen }: { isOpen: boolean }) => {
    return isOpen ? <div data-testid="feedback-modal">FeedbackModal Content</div> : null;
  },
}));

// Mock SubmissionPopover
vi.mock('../components/SubmissionPopover', () => ({
  SubmissionPopover: ({ isOpen, onFeedback, onNext }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="submission-popover">
        <p>SubmissionPopover</p>
        <button onClick={onFeedback}>View Feedback Now</button>
        <button onClick={onNext}>After Interview</button>
      </div>
    );
  },
}));

// Mock useAudioRecording
vi.mock('../hooks/useAudioRecording', () => ({
  useAudioRecording: () => {
    const [isRecording, setIsRecording] = React.useState(false);
    return {
      isRecording,
      startRecording: () => setIsRecording(true),
      stopRecording: async () => {
        setIsRecording(false);
        return new Blob(['mock-audio'], { type: 'audio/wav' });
      },
      mediaStream: null,
      permissionError: null,
    };
  },
}));

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    isListening: false,
    transcript: 'Mock transcript',
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscript: vi.fn(),
  }),
}));

vi.mock('../hooks/useTextAnswer', () => ({
  useTextAnswer: () => ({
    textAnswer: '',
    setTextAnswer: vi.fn(),
    resetText: vi.fn(),
    isSubmitting: false,
  }),
}));

// Mock services
const analyzeAnswerMock = vi.fn();
vi.mock('../services/geminiService', () => ({
  analyzeAnswer: (...args: any[]) => analyzeAnswerMock(...args),
  generateSpeech: vi.fn().mockResolvedValue('mock-audio-url'),
}));

// Mock child components
vi.mock('../components/AudioVisualizer', () => ({ default: () => <div /> }));
vi.mock('../components/session/TipsAndTranscriptContent', () => ({
  TipsAndTranscriptContent: () => <div />,
}));
vi.mock('../components/DebugInfoModal', () => ({ DebugInfoModal: () => <div /> }));

const mockQuestion = { id: 'q1', text: 'Question 1', tips: ['Tip 1'] };

describe('InterviewSession Feedback Flow', () => {
  it('shows loader then modal if analysis is still pending when "Now" is clicked', async () => {
    // Setup: Late analysis resolution
    let resolveAnalysis: any;
    analyzeAnswerMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAnalysis = resolve;
      })
    );

    // Mutable State
    const mutableSession = {
      id: '123',
      role: 'Test Role',
      questions: [mockQuestion],
      currentQuestionIndex: 0,
      answers: {} as any,
      status: 'IN_PROGRESS',
      blueprint: {},
      intakeData: {},
    };

    const saveAnswerMock = vi.fn((qId, ans) => {
      mutableSession.answers[qId] = ans;
    });
    const mockContextValue = {
      session: mutableSession as any,
      startSession: vi.fn(),
      nextQuestion: vi.fn(),
      goToQuestion: vi.fn(),
      saveAnswer: saveAnswerMock,
      finishSession: vi.fn(),
      loadTipsForQuestion: vi.fn(),
      clearAnswer: vi.fn(),
      updateAnswerAnalysis: vi.fn(),
      resetSession: vi.fn(),
      updateSession: vi.fn(),
      isLoading: false,
      audioUrls: {},
      cacheAudioUrl: vi.fn(),
    };

    render(
      <BrowserRouter>
        <SessionContext.Provider value={mockContextValue}>
          <InterviewSession />
        </SessionContext.Provider>
      </BrowserRouter>
    );

    // Record & Submit
    await React.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Recording' }));
    });
    await waitFor(() => expect(screen.getByText('Recording...')).toBeInTheDocument());
    await React.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Recording' }));
    });
    await waitFor(() => expect(screen.getByText('Recording Complete')).toBeInTheDocument());

    await React.act(async () => {
      fireEvent.click(screen.getByText('Submit Answer'));
    });

    // Popover Shows
    await waitFor(() => expect(screen.getByTestId('submission-popover')).toBeInTheDocument());

    // Click "View Feedback Now" immediately (Analysis is pending)
    fireEvent.click(screen.getByText('View Feedback Now'));

    // EXPECT: Loader to appear
    await waitFor(() => expect(screen.getByTestId('multistep-loader')).toBeInTheDocument());

    // Resolve analysis now
    await React.act(async () => {
      resolveAnalysis({ feedback: ['Good job'] });
    });

    // Wait for loader to finish and Modal to appear
    await waitFor(() => expect(screen.getByTestId('feedback-modal')).toBeInTheDocument(), {
      timeout: 4000,
    });

    // EXPECT: Loader gone
    expect(screen.queryByTestId('multistep-loader')).not.toBeInTheDocument();
  });

  it('skips loader and shows modal immediately if analysis is already complete', async () => {
    // Setup: Instant analysis
    analyzeAnswerMock.mockResolvedValue({ feedback: ['Fast job'] });

    const mutableSession = {
      id: '124',
      role: 'Test Role',
      questions: [mockQuestion],
      currentQuestionIndex: 0,
      answers: {} as any,
      status: 'IN_PROGRESS',
      blueprint: {},
      intakeData: {},
    };
    const saveAnswerMock = vi.fn((qId, ans) => {
      mutableSession.answers[qId] = ans;
    });
    const mockContextValue = {
      session: mutableSession as any,
      startSession: vi.fn(),
      nextQuestion: vi.fn(),
      goToQuestion: vi.fn(),
      saveAnswer: saveAnswerMock,
      finishSession: vi.fn(),
      loadTipsForQuestion: vi.fn(),
      clearAnswer: vi.fn(),
      updateAnswerAnalysis: vi.fn(),
      resetSession: vi.fn(),
      updateSession: vi.fn(),
      isLoading: false,
      audioUrls: {},
      cacheAudioUrl: vi.fn(),
    };

    render(
      <BrowserRouter>
        <SessionContext.Provider value={mockContextValue}>
          <InterviewSession />
        </SessionContext.Provider>
      </BrowserRouter>
    );

    // Record & Submit
    await React.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Recording' }));
    });
    await waitFor(() => expect(screen.getByText('Recording...')).toBeInTheDocument());
    await React.act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Recording' }));
    });
    await waitFor(() => expect(screen.getByText('Recording Complete')).toBeInTheDocument());

    await React.act(async () => {
      fireEvent.click(screen.getByText('Submit Answer'));
    });

    // Wait for analysis to be SAVED to session (optimization condition)
    // We know saveAnswer is called twice: once for pending (null), once for final.
    await waitFor(() => {
      expect(saveAnswerMock).toHaveBeenCalledTimes(2);
      expect(mutableSession.answers['q1'].analysis).not.toBeNull();
    });

    // Click "View Feedback Now"
    fireEvent.click(screen.getByText('View Feedback Now'));

    // EXPECT: NO Loader
    expect(screen.queryByTestId('multistep-loader')).not.toBeInTheDocument();

    // EXPECT: Modal immediately
    await waitFor(() => expect(screen.getByTestId('feedback-modal')).toBeInTheDocument());
  });
});
