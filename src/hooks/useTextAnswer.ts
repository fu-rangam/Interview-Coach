import { useState } from 'react';
import { sanitizeInput, truncateInput } from '../lib/sanitize';

const MAX_TEXT_LENGTH = 1500;

export function useTextAnswer() {
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

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
            setError("Answer is too short. Please elaborate (min 10 chars).");
            return null;
        }

        const sanitized = sanitizeInput(truncateInput(trimmed, MAX_TEXT_LENGTH));
        return sanitized;
    };

    const resetText = () => {
        setText('');
        setError(null);
    };

    return {
        text,
        error,
        handleTextChange,
        submitTextAnswer,
        resetText,
        maxLength: MAX_TEXT_LENGTH
    };
}
