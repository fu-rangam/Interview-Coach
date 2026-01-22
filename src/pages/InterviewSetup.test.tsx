import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterviewSetup } from './InterviewSetup';
import { SessionContext } from '../context/SessionContext';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('../components/ResumeUploadZone', () => ({
  ResumeUploadZone: () => <div>Resume Upload Zone</div>,
}));

const mockContextValue: any = {
  startSession: vi.fn().mockResolvedValue(undefined),
  resetSession: vi.fn(),
  isLoading: false,
};

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { role: 'Software Engineer' } }),
  };
});

describe('InterviewSetup', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SessionContext.Provider value={mockContextValue}>
          <InterviewSetup />
        </SessionContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders the setup form', () => {
    renderComponent();
    expect(screen.getByText('Interview Setup')).toBeInTheDocument();
    expect(screen.getByText('Target Role')).toBeInTheDocument();
    expect(screen.getByText('Job Description')).toBeInTheDocument();
  });

  it('pre-fills role from location state', () => {
    renderComponent();
    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
  });

  it('shows error if starting without JD', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Start Session'));
    expect(screen.getByText(/Please provide both/i)).toBeInTheDocument();
  });
});
