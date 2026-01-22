import { useState } from 'react';
import { sanitizeInput, truncateInput } from '../lib/sanitize';

const MAX_TEXT_LENGTH = 2000;

export function useTextAnswer() {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (newText: string) => {
    if (newText.length > MAX_TEXT_LENGTH) {
      // Allow typing but show error or just truncate?
      // Better UX is to truncate or stop typing
      return;
    }
    setText(newText);
    setError(null);
  };

  const submitTextAnswer = (): string | null => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setError('Answer is too short. Please elaborate (min 10 chars).');
      return null;
    }

    setIsSubmitting(true);
    const sanitized = sanitizeInput(truncateInput(trimmed, MAX_TEXT_LENGTH));

    // Mock async
    setTimeout(() => setIsSubmitting(false), 500);

    return sanitized;
  };

  const resetText = () => {
    setText('');
    setError(null);
    setIsSubmitting(false);
  };

  return {
    textAnswer: text,
    setTextAnswer: setText,
    error,
    handleTextChange,
    submitTextAnswer,
    resetText,
    isSubmitting,
    maxLength: MAX_TEXT_LENGTH,
  };
}
