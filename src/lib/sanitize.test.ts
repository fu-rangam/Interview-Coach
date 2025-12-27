import { describe, it, expect } from 'vitest';
import { sanitizeInput, truncateInput } from './sanitize';

describe('Sanitize Utility', () => {
    describe('sanitizeInput', () => {
        it('should escape HTML special characters', () => {
            const input = '<script>alert("XSS & fun");</script>\'';
            const expected = '&lt;script&gt;alert(&quot;XSS &amp; fun&quot;);&lt;/script&gt;&#x27;';
            expect(sanitizeInput(input)).toBe(expected);
        });

        it('should not modify normal text', () => {
            const input = 'Hello World 123';
            expect(sanitizeInput(input)).toBe(input);
        });

        it('should handle empty strings', () => {
            expect(sanitizeInput('')).toBe('');
        });
    });

    describe('truncateInput', () => {
        it('should truncate strings longer than maxLength', () => {
            const input = 'This is a long sentence.';
            expect(truncateInput(input, 10)).toBe('This is a ');
        });

        it('should not truncate strings shorter than maxLength', () => {
            const input = 'Short';
            expect(truncateInput(input, 10)).toBe('Short');
        });

        it('should handle maxLength of 0', () => {
            expect(truncateInput('anything', 0)).toBe('');
        });
    });
});
