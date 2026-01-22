import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntakeForm } from './IntakeForm';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
const mockOnSubmit = vi.fn();

describe('IntakeForm', () => {
  it('renders the intro step initially', () => {
    render(<IntakeForm onSubmit={mockOnSubmit} />);
    expect(screen.getByText(/I'm going to ask a few quick questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Let's set you up to win/i)).toBeInTheDocument();
  });

  it('renders mobile navigation elements', () => {
    render(<IntakeForm onSubmit={mockOnSubmit} />);
    // The mobile "Let's Go" button should be present
    expect(screen.getByText("Let's Go")).toBeInTheDocument();
  });

  it('navigates to next step', () => {
    render(<IntakeForm onSubmit={mockOnSubmit} />);

    const startButtons = screen.getAllByRole('button');
    const nextButton = startButtons.find(
      (b) => b.textContent?.includes("Let's Go") || b.innerHTML.includes('chevron-right')
    );

    if (nextButton) {
      fireEvent.click(nextButton);
      // Should now be on next step (Stage)
      expect(screen.getByText(/What stage are you preparing for/i)).toBeInTheDocument();
    } else {
      throw new Error('Could not find next button');
    }
  });
});
