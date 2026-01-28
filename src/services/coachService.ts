import { SessionHistory } from './storageService';

// --- Types ---

export type SignalQuality = 'Insufficient' | 'Emerging' | 'Reliable' | 'Strong';

export interface BaselineSignal {
  state: 'Loading' | 'Empty' | 'Low Signal' | 'High Signal';
  text: string;
  grounding: string;
}

export interface ConstellationPoint {
  competency: string;
  strength: number; // 0-1 (Relative)
  confidence: number; // 0-1
}

export interface ConstellationSignal {
  state: 'Loading' | 'Empty' | 'Low Signal' | 'High Signal';
  points: ConstellationPoint[];
}

export interface CoachingFocusSignal {
  state: 'Loading' | 'Empty' | 'Low Signal' | 'High Signal';
  focus: string;
  rationale: string;
  action: string;
}

export interface ProgressSignal {
  state: 'Loading' | 'Empty' | 'Low Signal' | 'High Signal';
  direction: 'Up' | 'Flat' | 'Uneven' | 'None';
  description: string;
}

export interface CoachDashboardSignals {
  signalQuality: SignalQuality;
  baseline: BaselineSignal;
  constellation: ConstellationSignal;
  focus: CoachingFocusSignal;
  progress: ProgressSignal;
}

// --- Constants ---
// --- Constants ---
const MIN_SESSIONS_EMERGING = 1;

// Verified Engagement Time Thresholds (Seconds)
// Tier 3 Engagement: ~5 mins for Reliable, ~15 mins for Strong
const MIN_ENGAGED_SECONDS_EMERGING = 60;   // 1 minute
const MIN_ENGAGED_SECONDS_RELIABLE = 300;  // 5 minutes
const MIN_ENGAGED_SECONDS_STRONG = 900;    // 15 minutes

// Variance Threshold (Standard Deviation of scores)
const MAX_VARIANCE_CONSISTENT = 15; // Low variance = high consistency

// --- Signal Quality Logic ---
export function calculateSignalQuality(history: SessionHistory[]): SignalQuality {
  const count = history.length;
  if (count < MIN_SESSIONS_EMERGING) return 'Insufficient';

  // Calculate Verified Engagement Time (Tier 3)
  const totalEngagedSeconds = history.reduce((acc, session) => {
    // Legacy sessions might be null/undefined, treat as 0 or estimated min
    const sessionTime = session.session.engagedTimeSeconds || 0;
    return acc + sessionTime;
  }, 0);

  // Insufficient if practically no engagement
  if (totalEngagedSeconds < MIN_ENGAGED_SECONDS_EMERGING) {
    // Fallback: If they have sessions but time is 0 (legacy data), 
    // we treat it as Emerging if count >= 1 to avoid regressing old users too hard,
    // but we won't call it Reliable.
    return 'Emerging';
  }

  // Calculate Consistency (Variance)
  // Reliability requires both Time AND Consistency
  let isConsistent = true;
  if (count >= 3) {
    const scores = history.map(s => s.score);
    const mean = scores.reduce((a, b) => a + b, 0) / count;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // High variance degrades signal from Strong -> Reliable or Reliable -> Emerging
    if (stdDev > MAX_VARIANCE_CONSISTENT) {
      isConsistent = false;
    }
  }

  // Strong Signal:
  // 1. High Volume (Time)
  // 2. High Consistency (Low Variance)
  // 3. Minimum session count
  if (totalEngagedSeconds >= MIN_ENGAGED_SECONDS_STRONG && count >= 5) {
    return isConsistent ? 'Strong' : 'Reliable';
  }

  // Reliable Signal:
  // 1. Moderate Volume
  // 2. Minimum session count
  if (totalEngagedSeconds >= MIN_ENGAGED_SECONDS_RELIABLE && count >= 3) {
    return 'Reliable';
  }

  return 'Emerging';
}

// --- Derivation Functions ---

export function deriveBaseline(history: SessionHistory[]): BaselineSignal {
  const quality = calculateSignalQuality(history);

  if (quality === 'Insufficient') {
    return {
      state: 'Empty',
      text: 'Practice to establish your baseline.',
      grounding: 'Complete your first session to get started.',
    };
  }

  // Derive tone based on quality
  // Low Signal -> Tentative
  // High Signal -> Clear
  const isLowSignal = quality === 'Emerging';
  const recentScore = history.length > 0 ? history[0].score : 0;

  let descriptor = '';
  if (recentScore > 80) descriptor = 'strong';
  else if (recentScore > 60) descriptor = 'consistent';
  else descriptor = 'developing';

  if (isLowSignal) {
    return {
      state: 'Low Signal',
      text: `It appears you are building a ${descriptor} foundation.`,
      grounding: 'Based on your initial practice.',
    };
  }

  // High Signal
  return {
    state: 'High Signal',
    text: `You consistently demonstrate ${descriptor} interview skills.`,
    grounding: `Based on ${history.length} sessions.`,
  };
}

export function deriveConstellation(history: SessionHistory[]): ConstellationSignal {
  const quality = calculateSignalQuality(history);

  if (quality === 'Insufficient') {
    return { state: 'Empty', points: [] };
  }

  // Aggregate competency data
  // Note: Since we don't have granular competency tags in the SessionHistory top-level yet,
  // we mimic this by using random variation or basic properties for now.
  // In a real implementation, we would parse history[].session.questions[].competencyId

  // MOCK: Generate simplified relative strengths for demo
  // WE DO NOT STORE SCORES, we compute relative strength
  const competencies = ['Behavioral', 'Technical', 'Situational', 'Communication'];
  const points = competencies.map((c) => ({
    competency: c,
    strength: 0.5 + Math.random() * 0.4, // Mock relative strength
    confidence: 0.8,
  }));

  if (quality === 'Emerging') {
    // Compress differences for low signal
    const compressedPoints = points.map((p) => ({
      ...p,
      strength: 0.5 + (p.strength - 0.5) * 0.5, // Squash towards center
    }));
    return { state: 'Low Signal', points: compressedPoints };
  }

  return { state: 'High Signal', points };
}

export function deriveCoachingFocus(history: SessionHistory[]): CoachingFocusSignal {
  const quality = calculateSignalQuality(history);

  if (quality === 'Insufficient') {
    return {
      state: 'Empty',
      focus: 'Foundational Communication',
      rationale: 'Every interview starts with clear communication.',
      action: 'Practice the "Tell me about yourself" question.',
    };
  }

  // Simple heuristic: Find lowest performing area or random for now if granular data missing
  const isLowSignal = quality === 'Emerging';

  if (isLowSignal) {
    return {
      state: 'Low Signal',
      focus: 'Structure (STAR Method)',
      rationale: 'Your answers would benefit from more consistent structure.',
      action: 'Try to explicitly tag your Situation, Task, Action, and Result.',
    };
  }

  // High confidence focus
  return {
    state: 'High Signal',
    focus: 'Impact Quantification',
    rationale: 'You are giving good examples, but missing specific numbers.',
    action: 'Add one metric to your most recent project description.',
  };
}

export function deriveProgress(history: SessionHistory[]): ProgressSignal {
  const quality = calculateSignalQuality(history);

  if (quality === 'Insufficient' || quality === 'Emerging') {
    return { state: 'Low Signal', direction: 'None', description: 'Not enough data for trends.' };
  }

  // Check last 3 sessions trend
  // Minimal implementation
  const last3 = history.slice(0, 3);
  if (last3.length < 2)
    return { state: 'Low Signal', direction: 'None', description: 'Need more sessions.' };

  const current = last3[0].score;
  const prev = last3[1].score;

  if (current > prev + 5)
    return { state: 'High Signal', direction: 'Up', description: 'Momentum is building.' };
  if (current < prev - 5)
    return {
      state: 'High Signal',
      direction: 'Uneven',
      description: 'Performance is fluctuating.',
    };

  return { state: 'High Signal', direction: 'Flat', description: 'Consistency is stable.' };
}

export function generateDashboardSignals(history: SessionHistory[]): CoachDashboardSignals {
  return {
    signalQuality: calculateSignalQuality(history),
    baseline: deriveBaseline(history),
    constellation: deriveConstellation(history),
    focus: deriveCoachingFocus(history),
    progress: deriveProgress(history),
  };
}
