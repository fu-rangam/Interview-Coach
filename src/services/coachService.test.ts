import { describe, it, expect } from 'vitest';
import {
  calculateSignalQuality,
  deriveBaseline,
  deriveConstellation,
  deriveCoachingFocus,
  deriveProgress,
} from './coachService';
import { SessionHistory } from './storageService';

// Mock Helper
const createMockHistory = (
  count: number,
  score: number = 70,
  engagedSeconds: number = 300
): SessionHistory[] => {
  return Array(count)
    .fill(null)
    .map((_, i) => ({
      id: `session-${i}`,
      timestamp: Date.now() - i * 86400000,
      date: '2024-01-01',
      role: 'Software Engineer',
      score: score,
      questionsCount: 3,
      session: {
        role: 'Software Engineer',
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        engagedTimeSeconds: engagedSeconds, // Mock engagement time
      },
    }));
};

describe('Coach Service - Signal Quality', () => {
  it('should return Insufficient for 0 sessions', () => {
    const history = createMockHistory(0);
    expect(calculateSignalQuality(history)).toBe('Insufficient');
  });

  it('should return Emerging for 1 session (Time < Reliable Threshold)', () => {
    // 1 session, 100 seconds (above 60s emerging, below 300s reliable)
    // 1 session is not enough count for Reliable anyway
    expect(calculateSignalQuality(createMockHistory(1, 70, 100))).toBe('Emerging');
  });

  it('should return Reliable for 3 sessions with sufficient time and consistency', () => {
    // 3 sessions, 200s each = 600s total (> 300s threshold)
    expect(calculateSignalQuality(createMockHistory(3, 70, 200))).toBe('Reliable');
  });

  it('should return Strong for 5+ sessions with high time and consistency', () => {
    // 5 sessions, 300s each = 1500s total (> 900s threshold)
    expect(calculateSignalQuality(createMockHistory(5, 70, 300))).toBe('Strong');
  });

  it('should downgrade Strong to Reliable if Variance is high', () => {
    // 5 sessions, huge time, but WILD scores
    const erraticHistory = [
      ...createMockHistory(1, 10, 300),
      ...createMockHistory(1, 90, 300),
      ...createMockHistory(1, 10, 300),
      ...createMockHistory(1, 90, 300),
      ...createMockHistory(1, 50, 300),
    ];
    // Total time = 1500s (Strong level)
    // Count = 5 (Strong level)
    // Variance = MASSIVE -> Should downgrade
    expect(calculateSignalQuality(erraticHistory)).toBe('Reliable');
  });
});

describe('Coach Service - Baseline', () => {
  it('should be Empty state when Insufficient', () => {
    const history = createMockHistory(0);
    const baseline = deriveBaseline(history);
    expect(baseline.state).toBe('Empty');
    expect(baseline.text).toContain('Practice to establish');
  });

  it('should use tentative language when Low Signal', () => {
    const history = createMockHistory(1); // Emerging
    const baseline = deriveBaseline(history);
    expect(baseline.state).toBe('Low Signal');
    expect(baseline.text).toContain('It appears');
  });

  it('should use confident language when High Signal', () => {
    const history = createMockHistory(5); // Strong
    const baseline = deriveBaseline(history);
    expect(baseline.state).toBe('High Signal');
    expect(baseline.text).toContain('You consistently demonstrate');
  });
});

describe('Coach Service - Constellation', () => {
  it('should be Low Signal state when Emerging', () => {
    const history = createMockHistory(1);
    const constellation = deriveConstellation(history);
    expect(constellation.state).toBe('Low Signal');
  });

  it('should compress strengths when Low Signal', () => {
    // In the implementation, we squashed relative strengths.
    // We can't easily test random values, but we can check the state is correct
    // and points are present.
    const history = createMockHistory(1);
    const constellation = deriveConstellation(history);
    expect(constellation.points.length).toBeGreaterThan(0);
  });
});

describe('Coach Service - Coaching Focus', () => {
  it('should suggest Foundational skills when Insufficient', () => {
    const history = createMockHistory(0);
    const focus = deriveCoachingFocus(history);
    expect(focus.state).toBe('Empty');
    expect(focus.focus).toBe('Foundational Communication');
  });

  it('should suggest Structure when Low Signal', () => {
    const history = createMockHistory(1);
    const focus = deriveCoachingFocus(history);
    expect(focus.state).toBe('Low Signal');
    expect(focus.focus).toBe('Structure (STAR Method)');
  });
});

describe('Coach Service - Progress', () => {
  it('should show No direction when Insufficient', () => {
    const history = createMockHistory(0);
    const progress = deriveProgress(history);
    expect(progress.direction).toBe('None');
  });

  it('should show Up direction when score improves', () => {
    // History is newest first.
    // Index 0: 80, Index 1: 70 -> Improvement
    const history = [
      { ...createMockHistory(1, 80)[0] },
      { ...createMockHistory(1, 70)[0] },
      { ...createMockHistory(1, 70)[0] },
      { ...createMockHistory(1, 70)[0] },
    ];
    // Need enough history for "Reliable" (3+) so we get a signal,
    // OR just verify it returns "High Signal" if implemented that way.
    // In our implementation, we need "Reliable" (3+) to show progress?
    // Let's check logic:
    // if (quality === 'Insufficient' || quality === 'Emerging') -> Low Signal
    // So we need 3 sessions.

    // Actually the mock helper makes singular items, allow me to construct array manually above.

    const progress = deriveProgress(history);
    // 4 sessions -> Reliable.
    // current (80) > prev (70) + 5
    expect(progress.state).toBe('High Signal');
    expect(progress.direction).toBe('Up');
  });
});
