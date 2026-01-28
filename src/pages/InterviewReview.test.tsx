import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InterviewReview } from './InterviewReview';
import { SessionContext, SessionContextType } from '../context/SessionContext';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Confetti
vi.mock('react-confetti', () => ({
  default: () => <div data-testid="confetti">Confetti</div>,
}));

// Mock AudioVisualizer (if used in review items)
vi.mock('../components/AudioVisualizer', () => ({
  default: () => <div>Visualizer</div>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    signOut: vi.fn(),
    loading: false,
  }),
}));

vi.mock('../hooks/useGuestTracker', () => ({
  useGuestTracker: () => ({
    markSessionComplete: vi.fn(),
    isGuest: false,
  }),
}));

const mockSession: any = {
  id: '123',
  role: 'Test Role',
  questions: [{ id: 'q1', text: 'Question 1', tips: [] }],
  answers: {
    q1: {
      text: 'Answer 1',
      analysis: {
        score: 85,
        feedback: 'Good',
        strongResponse: 'Better',
        keyTakeaways: ['Point 1'],
        whyItWorks: 'Reason',
        delivery: {
          pace: 'Good',
          clarity: 'Clear',
          confidence: 'High',
          tone: 'Professional',
        },
      },
    },
  },
  status: 'COMPLETED',
};

const mockContextValue: SessionContextType = {
  session: mockSession,
  startSession: vi.fn(),
  nextQuestion: vi.fn(),
  goToQuestion: vi.fn(),
  saveAnswer: vi.fn(),
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

describe('InterviewReview', () => {
  const renderComponent = (contextOverride = {}) => {
    return render(
      <BrowserRouter>
        <SessionContext.Provider value={{ ...mockContextValue, ...contextOverride }}>
          <InterviewReview />
        </SessionContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders the review header', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Performance Review')).toBeInTheDocument();
    });
  });

  it('displays the overall score', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  it('displays the role', () => {
    renderComponent();
    expect(screen.getByText('Test Role')).toBeInTheDocument();
  });

  it('displays answer review items', () => {
    renderComponent();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    // Just checking if question text is there is a good start
  });
});
