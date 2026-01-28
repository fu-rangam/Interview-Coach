import { useState, useEffect } from 'react';
import { sanitizeInput, truncateInput } from '../lib/sanitize';

const MAX_TEXT_LENGTH = 2000;
const DRAFT_PREFIX = 'interview_draft_';

export function useTextAnswer(questionId?: string, sessionId?: string) {
  // Store the ID we last synced with to detect changes during render
  // We use a composite key for sync detection
  const compositeKey = questionId && sessionId ? `${sessionId}_${questionId}` : null;
  const [prevKey, setPrevKey] = useState(compositeKey);

  const [text, setText] = useState(() => {
    if (!questionId || !sessionId) return '';
    const key = `${DRAFT_PREFIX}${sessionId}_${questionId}`;
    return sessionStorage.getItem(key) || '';
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when questionId/sessionId changes
  if (compositeKey !== prevKey) {
    setPrevKey(compositeKey);
    const key = compositeKey ? `${DRAFT_PREFIX}${compositeKey}` : '';
    const saved = key ? sessionStorage.getItem(key) : '';
    setText(saved || '');
    setError(null);
  }

  // Persist draft on text change
  useEffect(() => {
    if (!questionId || !sessionId) return;

    const key = `${DRAFT_PREFIX}${sessionId}_${questionId}`;
    const timeout = setTimeout(() => {
      if (text.trim()) {
        sessionStorage.setItem(key, text);
      } else {
        sessionStorage.removeItem(key); // Clear empty drafts
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [text, questionId, sessionId]);

  const handleTextChange = (newText: string) => {
    if (newText.length > MAX_TEXT_LENGTH) {
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

    // Clear draft from storage
    if (questionId && sessionId) {
      sessionStorage.removeItem(`${DRAFT_PREFIX}${sessionId}_${questionId}`);
    }
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
