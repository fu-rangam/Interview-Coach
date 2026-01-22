import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('RateLimiter Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Since callLog is a module-level variable, we need to ensure it's "cleared".
    // Advancing time by more than 60s at the start of each test will cause
    // older entries to be shifted out.
    vi.advanceTimersByTime(61000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow up to 10 calls within a minute', async () => {
    // We re-import to ensure a clean-ish check but the shift logic handles it
    const { checkRateLimit } = await import('./rateLimiter');

    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit()).toBe(true);
    }
  });

  it('should disallow the 11th call within the same minute', async () => {
    const { checkRateLimit } = await import('./rateLimiter');

    for (let i = 0; i < 10; i++) {
      checkRateLimit();
    }
    expect(checkRateLimit()).toBe(false);
  });

  it('should allow calls again after 60 seconds', async () => {
    const { checkRateLimit } = await import('./rateLimiter');

    // Fill the log
    for (let i = 0; i < 10; i++) {
      checkRateLimit();
    }
    expect(checkRateLimit()).toBe(false);

    // Advance time
    vi.advanceTimersByTime(60001);

    // Log should be effectively cleared by the shift logic inside checkRateLimit
    expect(checkRateLimit()).toBe(true);
  });
});
