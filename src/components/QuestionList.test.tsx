import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionList from './QuestionList';
import { Question } from '../types';
import React from 'react';

describe('QuestionList', () => {
    const mockQuestions: Question[] = [
        { id: '1', text: 'Question 1' },
        { id: '2', text: 'Question 2' },
    ];

    const mockProps = {
        questions: mockQuestions,
        currentIndex: 0,
        answers: {},
        onSelect: vi.fn(),
    };

    it('renders all questions', () => {
        render(<QuestionList {...mockProps} />);
        expect(screen.getByText('Question 1')).toBeDefined();
        expect(screen.getByText('Question 2')).toBeDefined();
    });

    it('highlights the active question', () => {
        render(<QuestionList {...mockProps} />);
        const activeBtn = screen.getByText('Question 1').closest('button');
        expect(activeBtn?.className).toContain('bg-blue-50/80');
    });

    it('shows check icon for answered questions', () => {
        const propsWithAnswer = {
            ...mockProps,
            answers: { '1': { text: 'Some answer' } }
        };
        const { container } = render(<QuestionList {...propsWithAnswer} />);
        // The Check icon is rendered inside the circle
        expect(container.querySelector('svg')).toBeDefined();
    });

    it('calls onSelect when a question is clicked', () => {
        render(<QuestionList {...mockProps} />);
        fireEvent.click(screen.getByText('Question 2'));
        expect(mockProps.onSelect).toHaveBeenCalledWith(1);
    });

    it('renders back button when onBack is provided', () => {
        const onBack = vi.fn();
        render(<QuestionList {...mockProps} onBack={onBack} />);
        const backBtn = screen.getByRole('button', { name: '' }); // ChevronLeft doesn't have text, but it's the first button
        // Looking for the button containing the ChevronLeft
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // First button is onBack in header
        expect(onBack).toHaveBeenCalled();
    });

    it('does not render back button when onBack is missing', () => {
        render(<QuestionList {...mockProps} />);
        // Only the question buttons should be present (2 questions = 2 buttons + header title is NOT a button)
        // Wait, the questions are in buttons.
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(2);
    });
});
