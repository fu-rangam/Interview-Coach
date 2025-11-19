import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuestionCard from './QuestionCard';

describe('QuestionCard', () => {
  const defaultProps = {
    question: 'Tell me about yourself',
    role: 'Software Engineer',
    currentIndex: 0,
    total: 5,
  };

  it('should render the question text', () => {
    render(<QuestionCard {...defaultProps} />);
    
    expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
  });

  it('should display the role badge', () => {
    render(<QuestionCard {...defaultProps} />);
    
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('should show correct question counter', () => {
    render(<QuestionCard {...defaultProps} />);
    
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });

  it('should display correct counter for middle question', () => {
    render(<QuestionCard {...defaultProps} currentIndex={2} />);
    
    expect(screen.getByText('Question 3 of 5')).toBeInTheDocument();
  });

  it('should display correct counter for last question', () => {
    render(<QuestionCard {...defaultProps} currentIndex={4} total={5} />);
    
    expect(screen.getByText('Question 5 of 5')).toBeInTheDocument();
  });

  it('should render long questions properly', () => {
    const longQuestion = 'Describe a situation where you had to work with a difficult team member and how you handled the conflict to achieve a positive outcome';
    
    render(<QuestionCard {...defaultProps} question={longQuestion} />);
    
    expect(screen.getByText(longQuestion)).toBeInTheDocument();
  });

  it('should handle different role names', () => {
    render(<QuestionCard {...defaultProps} role="Data Scientist" />);
    
    expect(screen.getByText('Data Scientist')).toBeInTheDocument();
  });

  it('should render with proper styling classes', () => {
    const { container } = render(<QuestionCard {...defaultProps} />);
    
    const card = container.querySelector('.bg-white');
    expect(card).toBeInTheDocument();
  });
});
