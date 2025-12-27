import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionTips from './QuestionTips';
import { QuestionTips as QuestionTipsType } from '../types';
import React from 'react';

describe('QuestionTips', () => {
    const mockTips: QuestionTipsType = {
        lookingFor: 'A specific skill',
        pointsToCover: ['Point A', 'Point B'],
        answerFramework: 'STAR approach',
        industrySpecifics: {
            metrics: 'KPI 1',
            tools: 'Tool A'
        },
        mistakesToAvoid: ['Mistake 1'],
        proTip: 'A pro tip'
    };

    it('renders null when no tips provided', () => {
        const { container } = render(<QuestionTips />);
        expect(container.firstChild).toBeNull();
    });

    it('renders all section headers', () => {
        render(<QuestionTips tips={mockTips} />);
        expect(screen.getByText("What They're Looking For")).toBeDefined();
        expect(screen.getByText("Specific Points to Cover")).toBeDefined();
        expect(screen.getByText("Expert Pro Tip")).toBeDefined();
    });

    it('expands a section when clicked', () => {
        render(<QuestionTips tips={mockTips} />);

        // Initially hidden
        expect(screen.queryByText('A specific skill')).toBeNull();

        // Click to expand
        fireEvent.click(screen.getByText("What They're Looking For"));
        expect(screen.getByText('A specific skill')).toBeDefined();
    });

    it('collapses a section when clicked again', () => {
        render(<QuestionTips tips={mockTips} />);

        const header = screen.getByText("What They're Looking For");
        fireEvent.click(header);
        expect(screen.queryByText('A specific skill')).not.toBeNull();

        fireEvent.click(header);
        expect(screen.queryByText('A specific skill')).toBeNull();
    });

    it('only one section can be expanded at a time', () => {
        render(<QuestionTips tips={mockTips} />);

        fireEvent.click(screen.getByText("What They're Looking For"));
        expect(screen.queryByText('A specific skill')).not.toBeNull();

        fireEvent.click(screen.getByText("Specific Points to Cover"));
        // First one should be closed
        expect(screen.queryByText('A specific skill')).toBeNull();
        // Second one should be open
        expect(screen.getByText('Point A')).toBeDefined();
    });
});
