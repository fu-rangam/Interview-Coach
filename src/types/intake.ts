export type ConfidenceScore = 1 | 2 | 3 | 4 | 5;

export type BiggestStruggle =
    | "getting_started"
    | "staying_organized"
    | "explaining_impact"
    | "technical_depth"
    | "behavioral_storytelling"
    | "weaknesses_gaps"
    | "nerves_anxiety"
    | ""; // Added empty state

export type ChallengeLevel = "warm_up" | "realistic" | "pressure_test";

export type PrimaryGoal =
    | "build_confidence"
    | "get_more_structured"
    | "practice_star_stories"
    | "get_more_concise"
    | "improve_metrics"
    | "role_specific_depth"
    | "practice_hard_questions";

export type InterviewStage =
    | "recruiter_screen"
    | "hiring_manager"
    | "panel"
    | "final_round"
    | ""; // Added empty state

export type StrongExamplePreference =
    | "always"
    | "only_when_developing"
    | "never";

export interface OnboardingIntakeV1 {
    intakeVersion: "v1";
    confidenceScore: ConfidenceScore;
    biggestStruggle: BiggestStruggle; // No longer has a default in type definition, handled in runtime
    challengeLevel: ChallengeLevel;
    primaryGoal: PrimaryGoal;
    stage: InterviewStage;
    allowFollowUps: boolean;
    includeStrongExamples: StrongExamplePreference;
    mustPracticeQuestions: string[];
}

export const BIGGEST_STRUGGLE_OPTIONS: {
    value: BiggestStruggle;
    label: string;
}[] = [
        { value: "getting_started", label: "Getting started (blank mind)" },
        { value: "staying_organized", label: "Staying organized (rambling)" },
        { value: "explaining_impact", label: "Explaining impact (results/metrics)" },
        { value: "technical_depth", label: "Technical depth" },
        { value: "behavioral_storytelling", label: "Behavioral storytelling (STAR examples)" },
        { value: "weaknesses_gaps", label: "Handling weaknesses/gaps" },
        { value: "nerves_anxiety", label: "Nerves/anxiety" }
    ];

export const CHALLENGE_LEVEL_OPTIONS: {
    value: ChallengeLevel;
    label: string;
    description: string;
}[] = [
        {
            value: "warm_up",
            label: "Warm-up",
            description: "Build confidence and rhythm"
        },
        {
            value: "realistic",
            label: "Realistic",
            description: "Like a real interview"
        },
        {
            value: "pressure_test",
            label: "Pressure test",
            description: "Tougher follow-ups and expectations"
        }
    ];

export const PRIMARY_GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
    { value: "build_confidence", label: "Build confidence" },
    { value: "get_more_structured", label: "Get more structured" },
    { value: "practice_star_stories", label: "Practice STAR stories" },
    { value: "get_more_concise", label: "Get more concise" },
    { value: "improve_metrics", label: "Improve metrics/results" },
    { value: "role_specific_depth", label: "Practice role-specific depth" },
    { value: "practice_hard_questions", label: "Practice hard questions" }
];

export const INTERVIEW_STAGE_OPTIONS: {
    value: InterviewStage;
    label: string;
}[] = [
        { value: "recruiter_screen", label: "Recruiter screen" },
        { value: "hiring_manager", label: "Hiring manager interview" },
        { value: "panel", label: "Panel interview" },
        { value: "final_round", label: "Final round" }
    ];

export const STRONG_EXAMPLE_OPTIONS: {
    value: StrongExamplePreference;
    label: string;
}[] = [
        { value: "always", label: "Always" },
        { value: "only_when_developing", label: "Only if my score isn't strong" },
        { value: "never", label: "Never" }
    ];

export const DEFAULT_ONBOARDING_INTAKE_V1: OnboardingIntakeV1 = {
    intakeVersion: "v1",
    confidenceScore: 3,
    biggestStruggle: "", // Default to empty
    challengeLevel: "realistic",
    primaryGoal: "get_more_structured",
    stage: "", // Default to empty
    allowFollowUps: true,
    includeStrongExamples: "only_when_developing",
    mustPracticeQuestions: []
};

export function validateOnboardingIntakeV1(input: any): OnboardingIntakeV1 {
    const safe: OnboardingIntakeV1 = {
        ...DEFAULT_ONBOARDING_INTAKE_V1,
        ...(input ?? {})
    };

    if (![1, 2, 3, 4, 5].includes(safe.confidenceScore)) {
        safe.confidenceScore = 3;
    }

    if (!Array.isArray(safe.mustPracticeQuestions)) {
        safe.mustPracticeQuestions = [];
    }

    safe.allowFollowUps = Boolean(safe.allowFollowUps);

    return safe;
}

export function normalizeMustPracticeQuestions(qs: string[]): string[] {
    return qs
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 6);
}
