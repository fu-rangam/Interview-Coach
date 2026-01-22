import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DebugInfoModal } from './DebugInfoModal';
import { InterviewSession } from '../types';

describe('DebugInfoModal Accessibility', () => {
  const mockSession: InterviewSession = {
    id: 'test-session',
    role: 'Developer',
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    status: 'ACTIVE',
  };

  it('should have accessible labels for all buttons', () => {
    render(<DebugInfoModal isOpen={true} onClose={vi.fn()} session={mockSession} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toBeInTheDocument();
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });
});
