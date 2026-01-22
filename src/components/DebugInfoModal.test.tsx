
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
        status: 'ACTIVE'
    };

    it('should have accessible labels for all buttons', () => {
        render(
            <DebugInfoModal
                isOpen={true}
                onClose={vi.fn()}
                session={mockSession}
            />
        );

        // The Copy button might technically have text, but we want to ensure it has a stable accessible name if requested.
        // Ideally, it should satisfy "Copy Report" or similar.
        // If the user says it lacks accessible label, maybe they want aria-label specifically.
        // We'll check for "Copy Markdown Report" which is the title, or explicit name.
        const copyButton = screen.getByRole('button', { name: /copy/i });
        expect(copyButton).toBeInTheDocument();

        // The Close button is definitely missing a label (it's icon-only)
        // This is the main failure point we expect to fix.
        // We look for "Close" or "Close debug view"
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toBeInTheDocument();
    });
});
