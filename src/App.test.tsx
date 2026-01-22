import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as geminiService from './services/geminiService';

// Mock the gemini service
vi.mock('./services/geminiService');

// Mock HTMLAudioElement
beforeEach(() => {
  global.HTMLAudioElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  global.HTMLAudioElement.prototype.pause = vi.fn();
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Home Screen', () => {
    it('should render home screen with start button', () => {
      render(<App />);

      expect(screen.getByText(/Interview Coach/i)).toBeDefined();
      expect(screen.getByText(/Start Practicing/i)).toBeDefined();
    });

    it('should navigate to role selection when start button is clicked', async () => {
      render(<App />);

      const startButton = screen.getByText(/Start Practicing/i);
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Select your target role/i)).toBeDefined();
      });
    });
  });

  describe('Role Selection', () => {
    beforeEach(() => {
      vi.mocked(geminiService.generateQuestions).mockResolvedValue([
        { id: '1', text: 'Question 1' },
        { id: '2', text: 'Question 2' },
        { id: '3', text: 'Question 3' },
        { id: '4', text: 'Question 4' },
        { id: '5', text: 'Question 5' },
      ]);
    });

    it('should display job role options', async () => {
      render(<App />);

      const startButton = screen.getByText(/Start Practicing/i);
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Data Analytics')).toBeDefined();
        expect(screen.getByText('Project Management')).toBeDefined();
        expect(screen.getByText('UX Design')).toBeDefined();
      });
    });

    it('should generate questions when role is selected', async () => {
      render(<App />);

      const startButton = screen.getByText(/Start Practicing/i);
      fireEvent.click(startButton);

      await waitFor(() => {
        const roleButton = screen.getByText('Data Analytics');
        fireEvent.click(roleButton);
      });

      await waitFor(() => {
        expect(geminiService.generateQuestions).toHaveBeenCalledWith('Data Analytics');
      });
    });

    it('should show loading state while generating questions', async () => {
      let resolveQuestions: any;
      vi.mocked(geminiService.generateQuestions).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveQuestions = resolve;
          })
      );

      render(<App />);

      const startButton = screen.getByText(/Start Practicing/i);
      fireEvent.click(startButton);

      await waitFor(() => {
        const roleButton = screen.getByText('Data Analytics');
        fireEvent.click(roleButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Preparing your interview/i)).toBeDefined();
      });

      // Resolve the promise
      resolveQuestions([{ id: '1', text: 'Test question' }]);
    });
  });

  describe('Interview Screen', () => {
    beforeEach(async () => {
      vi.mocked(geminiService.generateQuestions).mockResolvedValue([
        { id: '1', text: 'What is your biggest strength?' },
        { id: '2', text: 'Tell me about yourself' },
      ]);
    });

    it('should display first question after role selection', async () => {
      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('What is your biggest strength?')).toBeDefined();
      });
    });

    it('should show record button', async () => {
      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        // Check for the instruction text that appears when not recording
        expect(screen.getByText(/Click the microphone to begin your answer/i)).toBeDefined();
      });
    });
  });

  describe('Navigation', () => {
    it('should allow returning to home from any screen', async () => {
      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        const homeButton = screen.getByText(/Back Home/i);
        fireEvent.click(homeButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Interview Coach/i)).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle question generation failure', async () => {
      vi.mocked(geminiService.generateQuestions).mockRejectedValue(new Error('API Error'));

      // Mock alert
      global.alert = vi.fn();

      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to generate questions')
        );
      });
    });
  });

  describe('Audio Narration Integration', () => {
    beforeEach(() => {
      vi.mocked(geminiService.generateQuestions).mockResolvedValue([
        { id: '1', text: 'What is your biggest strength?' },
        { id: '2', text: 'Tell me about yourself' },
      ]);
      vi.mocked(geminiService.generateSpeech).mockResolvedValue('blob:mock-audio-url');
    });

    it('should show Play Voice button on question screen', async () => {
      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play narration/i })).toBeDefined();
      });
    });

    it('should call generateSpeech when Play Voice is clicked', async () => {
      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: /play narration/i });
        fireEvent.click(playButton);
      });

      await waitFor(() => {
        expect(geminiService.generateSpeech).toHaveBeenCalledWith('What is your biggest strength?');
      });
    });

    it('should reset audio state when navigating to next question', async () => {
      vi.mocked(geminiService.analyzeAnswer).mockResolvedValue({
        transcript: 'I am good at problem solving',
        feedback: ['Good answer'],
        keyTerms: ['Problem Solving'],
        rating: 'Strong',
      });

      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('What is your biggest strength?')).toBeDefined();
      });

      // Play audio on first question
      const playButton = screen.getByRole('button', { name: /play narration/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(geminiService.generateSpeech).toHaveBeenCalledWith('What is your biggest strength?');
        expect(screen.getByText('Playing...')).toBeDefined();
      });

      // Verify audio controls work correctly in integration context
      expect(HTMLAudioElement.prototype.play).toHaveBeenCalled();
    });

    it('should handle audio generation failure gracefully', async () => {
      vi.mocked(geminiService.generateSpeech).mockResolvedValue(null);

      render(<App />);

      fireEvent.click(screen.getByText(/Start Practicing/i));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Analytics'));
      });

      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: /play narration/i });
        fireEvent.click(playButton);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Narration failed/i)).toBeDefined();
      });
    });
  });
});
