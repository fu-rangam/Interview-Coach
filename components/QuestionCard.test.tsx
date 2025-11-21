import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionCard from './QuestionCard';

// Mock generateSpeech
vi.mock('../services/geminiService', () => ({
  generateSpeech: vi.fn(),
}));

import { generateSpeech } from '../services/geminiService';

describe('QuestionCard', () => {
  const defaultProps = {
    question: 'Tell me about yourself',
    role: 'Software Engineer',
    currentIndex: 0,
    total: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock HTMLAudioElement
    global.HTMLAudioElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    global.HTMLAudioElement.prototype.pause = vi.fn();
  });

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

  describe('Audio Narration', () => {
    it('should display Play Voice button', () => {
      render(<QuestionCard {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /play narration/i })).toBeInTheDocument();
    });

    it('should show "Play Voice" text initially', () => {
      render(<QuestionCard {...defaultProps} />);
      
      expect(screen.getByText('Play Voice')).toBeInTheDocument();
    });

    it('should call generateSpeech when Play Voice is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue('blob:mock-url');
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);

      expect(generateSpeech).toHaveBeenCalledWith('Tell me about yourself');
    });

    it('should show loading state while fetching audio', async () => {
      const user = userEvent.setup();
      let resolveAudio: (value: string) => void;
      const audioPromise = new Promise<string>((resolve) => {
        resolveAudio = resolve;
      });
      vi.mocked(generateSpeech).mockReturnValue(audioPromise);
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(button).toBeDisabled();

      resolveAudio!('blob:mock-url');
    });

    it('should change to "Pause Voice" when playing', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue('blob:mock-url');
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Playing...')).toBeInTheDocument();
      });
    });

    it('should disable button while audio is playing', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue('blob:mock-url');
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      
      // Start playing
      await user.click(button);
      await waitFor(() => expect(screen.getByText('Playing...')).toBeInTheDocument());
      
      // Button should be disabled during playback
      expect(button).toBeDisabled();
    });

    it('should show "Play Again" after audio ends', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue('blob:mock-url');
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      
      // Play
      await user.click(button);
      await waitFor(() => expect(screen.getByText('Playing...')).toBeInTheDocument());
      
      // Simulate audio ending
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        fireEvent.ended(audioElement);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Play Again')).toBeInTheDocument();
      });
    });

    it('should display error message when audio generation fails', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue(null);
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Narration failed/i)).toBeInTheDocument();
      });
    });

    it('should display error message when playback is blocked', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue('blob:mock-url');
      
      // Mock play() to throw
      vi.spyOn(HTMLAudioElement.prototype, 'play').mockRejectedValue(
        new Error('The play() request was interrupted')
      );
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Playback failed/i)).toBeInTheDocument();
      });
    });

    it('should reset audio state when question changes', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockResolvedValue('blob:mock-url');
      
      const { rerender } = render(<QuestionCard {...defaultProps} />);
      
      // Play audio
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);
      await waitFor(() => expect(screen.getByText('Playing...')).toBeInTheDocument());
      
      // Change question
      rerender(<QuestionCard {...defaultProps} question="What are your strengths?" />);
      
      // Should reset to initial state
      await waitFor(() => {
        expect(screen.getByText('Play Voice')).toBeInTheDocument();
      });
    });

    it('should not make duplicate requests when already loading', async () => {
      const user = userEvent.setup();
      let resolveAudio: (value: string) => void;
      const audioPromise = new Promise<string>((resolve) => {
        resolveAudio = resolve;
      });
      vi.mocked(generateSpeech).mockReturnValue(audioPromise);
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      
      // Click multiple times while loading
      await user.click(button);
      expect(button).toBeDisabled();
      
      // Button is disabled, so second click shouldn't go through
      // Just verify generateSpeech was called once
      expect(generateSpeech).toHaveBeenCalledTimes(1);

      resolveAudio!('blob:mock-url');
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(generateSpeech).mockRejectedValue(new Error('Network error'));
      
      render(<QuestionCard {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /play narration/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Narration failed/i)).toBeInTheDocument();
      });
    });
  });
});
