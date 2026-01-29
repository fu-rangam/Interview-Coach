# Competency-Driven Interview Coach (JD → Competencies → Questions → Evidence → Scoring → Feedback → Coaching)

This canvas contains the **complete artifact set** for a competency-driven interview practice system:

- A clean **end-to-end flow architecture**
- **JSON schemas** for every stage
- **Prompt templates** for every stage (role/JD → blueprint → question plan → questions → scoring → feedback → session summary)
- **Scoring model** (numeric + banding + weighting)
- **Implementation notes** (how to wire it up safely)
- A **quick user guide** (how a user experiences it)

---

## 0) Guiding Principles (Why this works)

### ✅ Core idea
Your app becomes reliable and “coach-like” when *everything* references a single shared object:

> **Competency Blueprint**

That blueprint is derived from the **job title + job description** and then becomes the source of truth.

### ✅ What you gain
- Questions stop being random
- Scoring stops being vibes
- Feedback becomes role-specific and actionable
- Numeric scoring becomes explainable
- Users feel guided, not judged

---

## 1) High-Level Pipeline (Full Flow)

### Inputs
- `roleTitle` (required)
- `jobDescription` (optional but strongly preferred)
- `seniority` (optional)
- `difficultyPreference` (optional)
- `modality` = `"text" | "voice"` (optional)

### Stages
1. **Competency Blueprint Generation**
2. **Question Plan Generation**
3. **Question Text Generation**
4. **Answer Evaluation (Scoring + Evidence)**
5. **Feedback Generation**
6. **Micro-Acknowledgement Generation**
7. **Session Aggregation + Summary**

---

## 2) Artifact A — Competency Blueprint

### A1) Blueprint JSON Schema (v1)

```json
{
  "role": {
    "title": "UI/UX Designer",
    "seniority": "mid"
  },
  "readingLevel": {
    "mode": "professional",
    "maxSentenceWords": 22,
    "avoidJargon": false
  },
  "competencies": [
    {
      "id": "C1",
      "name": "User Research & Insight",
      "definition": "Ability to plan and use research to uncover user needs and inform design decisions.",
      "signals": [
        "Describes research methods",
        "Explains insights",
        "Connects insight → design change"
      ],
      "evidenceExamples": [
        "usability test findings",
        "interview themes",
        "analytics drop-off points"
      ],
      "weight": 5,
      "bands": {
        "Developing": "Mentions research vaguely or without design linkage.",
        "Good": "Explains research and applies insights to decisions.",
        "Strong": "Shows clear causal chain + tradeoffs + measurable impact."
      }
    }
  ],
  "questionMix": {
    "behavioral": 0.5,
    "situational": 0.3,
    "technical": 0.2
  },
  "scoringModel": {
    "dimensions": [
      {
        "id": "D1",
        "name": "Relevance & Directness",
        "weight": 3
      },
      {
        "id": "D2",
        "name": "Structure & Clarity",
        "weight": 3
      },
      {
        "id": "D3",
        "name": "Specificity & Evidence",
        "weight": 4
      },
      {
        "id": "D4",
        "name": "Competency Evidence",
        "weight": 5
      },
      {
        "id": "D5",
        "name": "Impact & Outcomes",
        "weight": 4
      }
    ],
    "ratingBands": {
      "Developing": {"min": 0, "max": 69},
      "Good": {"min": 70, "max": 84},
      "Strong": {"min": 85, "max": 100}
    }
  }
}
```

### A2) Blueprint Prompt Template

**SYSTEM**
You are a senior interview coach and rubric engineer. Your job is to translate a job title and optional job description into a competency-driven interview rubric that can generate questions and score answers reliably.

**USER**
Create a Competency Blueprint in strict JSON.

INPUTS:
- roleTitle: {{ROLE_TITLE}}
- jobDescription: {{JOB_DESCRIPTION_OR_EMPTY}}
- seniority (optional): {{SENIORITY_OR_EMPTY}}

REQUIREMENTS:
1) Extract 5–8 competencies that matter most for success in the role.
2) Each competency must include: id, name, definition, signals, evidenceExamples, weight (1–5), and bands (Developing/Good/Strong behavioral anchors).
3) Provide a recommended questionMix across behavioral/situational/technical.
4) Provide a scoringModel with 5–7 dimensions and weights (1–5).
5) Ensure weights reflect role priorities.
6) Output ONLY valid JSON.

---

## 3) Artifact B — Question Plan

### B1) Question Plan JSON Schema

```json
{
  "role": "UI/UX Designer",
  "questions": [
    {
      "id": "Q1",
      "competencyId": "C1",
      "type": "behavioral",
      "difficulty": "medium",
      "intent": "Probe how user research changes design decisions.",
      "rubricHints": [
        "Mentions method",
        "Explains insight",
        "Connects insight → design change",
        "Mentions outcome"
      ]
    }
  ]
}
```

### B2) Question Plan Prompt Template

**SYSTEM**
You are an interview designer. Build a balanced question plan aligned to the competency blueprint.

**USER**
Create a question plan for this role using the blueprint.

RULES:
- Generate exactly {{N_QUESTIONS}} questions.
- Each question must map to exactly one competencyId.
- Ensure balanced coverage: all competencies should be hit at least once.
- Types must follow blueprint.questionMix approximately.
- Return ONLY strict JSON.

INPUT BLUEPRINT JSON:
{{COMPETENCY_BLUEPRINT_JSON}}

---

## 4) Artifact C — Question Text Generation

### C1) Question Text JSON Schema

```json
{
  "questions": [
    {
      "id": "Q1",
      "text": "Describe a time when user research changed your design. What happened?",
      "competencyId": "C1",
      "type": "behavioral",
      "difficulty": "medium"
    }
  ]
}
```

### C2) Question Text Prompt Template

**SYSTEM**
You generate interview questions in clear, appropriate language.

READING LEVEL RULES:
- If entry-level role: use 6th–7th grade reading level. Short sentences (<15 words). Avoid corporate jargon.
- If technical/executive: use appropriate professional terminology.
- When in doubt: prioritize simplicity.

**USER**
Convert the question plan into final question text.

CONSTRAINTS:
- Keep questions concise.
- Each question should test the competency described.
- Avoid repeating phrasing.
- Return ONLY strict JSON.

INPUTS:
Blueprint:
{{COMPETENCY_BLUEPRINT_JSON}}

Question Plan:
{{QUESTION_PLAN_JSON}}

---

## 5) Artifact D — Answer Evaluation (Numeric Scoring)

### D1) Evaluation JSON Schema

```json
{
  "questionId": "Q1",
  "competencyId": "C1",
  "dimensionScores": [
    {"dimensionId": "D1", "score": 90, "note": "Directly answered with clear framing."},
    {"dimensionId": "D2", "score": 88, "note": "Well structured, easy to follow."},
    {"dimensionId": "D3", "score": 92, "note": "Specific evidence and details."},
    {"dimensionId": "D4", "score": 94, "note": "Strong competency demonstration."},
    {"dimensionId": "D5", "score": 85, "note": "Impact stated; could add metric."}
  ],
  "answerScore": 91,
  "rating": "Strong",
  "evidenceExtracts": [
    "We ran moderated usability tests with 10 users",
    "Cart abandonment dropped by 20%"
  ],
  "missingElements": [
    "Could mention a key tradeoff considered"
  ]
}
```

### D2) Scoring Math (Implementation Logic)

**Weighted average across dimensions**

- For each dimension score `s_i` and weight `w_i`
- Compute:
  - `raw = sum(s_i * w_i) / sum(w_i)`
  - `answerScore = round(raw)`

**Banding**
- Developing: 0–69
- Good: 70–84
- Strong: 85–100

### D3) Evaluation Prompt Template

**SYSTEM**
You are an interview evaluator. You must score answers consistently using the rubric.

**USER**
Evaluate the user answer.

RULES:
1) Score each dimension 0–100.
2) Provide a short note per dimension.
3) Extract 1–3 evidence snippets from the user answer.
4) Identify 1–3 missing elements.
5) Calculate answerScore using the rubric weights.
6) Output ONLY strict JSON.

INPUTS:
Blueprint:
{{COMPETENCY_BLUEPRINT_JSON}}

Question:
{{QUESTION_OBJECT_JSON}}

User Answer:
{{USER_ANSWER_TEXT}}

---

## 6) Artifact E — Feedback Generation

### E1) Feedback JSON Schema

```json
{
  "questionId": "Q1",
  "rating": "Strong",
  "coachReaction": "Excellent use of specifics and outcomes.",
  "keyFeedback": [
    "You clearly explained what you did and why.",
    "Your example showed strong user-centered reasoning.",
    "Adding one tradeoff would make it even stronger."
  ],
  "biggestUpgrade": "Add one tradeoff you considered and why you chose your final approach.",
  "redoPrompt": "Try answering again and include one design tradeoff.",
  "strongAnswerExample": "(Optional)"
}
```

### E2) Feedback Prompt Template

**SYSTEM**
You are a supportive interview coach.

**USER**
Write feedback based on the scoring.

RULES:
- Keep tone encouraging and direct.
- Provide 3–5 key feedback points.
- Provide exactly 1 biggestUpgrade.
- Provide a redoPrompt that is actionable.
- strongAnswerExample is optional; keep short if included.
- Output ONLY strict JSON.

INPUTS:
Question:
{{QUESTION_OBJECT_JSON}}

User Answer:
{{USER_ANSWER_TEXT}}

Evaluation:
{{EVALUATION_JSON}}

---

## 7) Artifact F — Micro-Acknowledgement (Popover phrase)

### F1) Ack JSON Schema

```json
{
  "ackPhrase": "Strong answer—nice clarity and impact."
}
```

### F2) Ack Prompt Template

**SYSTEM**
You are a concise coaching assistant.

**USER**
Generate a micro acknowledgement phrase.

CONSTRAINTS:
- 3–10 words
- No emojis
- Avoid: "Got it", "Sure", "Okay", "No problem"
- Must reflect the user’s rating + biggestUpgrade
- Output ONLY JSON with ackPhrase

INPUTS:
Rating: {{RATING}}
BiggestUpgrade: {{BIGGEST_UPGRADE}}

---

## 8) Artifact G — Voice Delivery Feedback (Optional)

### G1) Delivery JSON Schema

```json
{
  "deliveryStatus": "Too Fast",
  "deliveryTips": [
    "Add one pause before your result.",
    "Slow down on key numbers and outcomes."
  ]
}
```

### G2) Delivery Prompt Template

**SYSTEM**
The user is interacting via VOICE ONLY. You cannot see them.
Do NOT mention posture, eye contact, attire, gestures, or facial expressions.
Only comment on audio: tone, pace, volume, clarity, pausing, filler words, energy.

**USER**
Analyze delivery from this transcript and audio cues.
Return only deliveryStatus (1–2 words) and exactly 2 deliveryTips.
Output ONLY strict JSON.

INPUT:
{{VOICE_TRANSCRIPT_AND_AUDIO_FEATURES}}

---

## 9) Artifact H — Session Aggregation

### H1) Session Summary JSON Schema

```json
{
  "overallScore": 92,
  "overallRating": "Strong",
  "competencyScores": [
    {"competencyId": "C1", "score": 94},
    {"competencyId": "C2", "score": 88}
  ],
  "strengths": [
    "Clear, structured responses",
    "Good use of specific examples"
  ],
  "topGrowthAreas": [
    "Add metrics more consistently",
    "Call out tradeoffs explicitly"
  ],
  "nextPracticePlan": [
    "Redo Q4 with one example + outcome",
    "Practice 2 technical questions for role tools"
  ]
}
```

### H2) Aggregation Logic
- Overall score = weighted average of answerScores
- Competency score = average of answers mapped to that competency
- Strengths = top 2 dimensions by average
- Growth areas = lowest 2 dimensions by average

---

# Quick User Guide (What the user experiences)

## What the user does
1) Enters job title
2) Pastes job description (optional)
3) Gets tailored questions
4) Answers each question (text or voice)
5) Receives:
   - rating label (Developing/Good/Strong)
   - numeric score
   - targeted feedback
   - a short coach acknowledgement
6) At the end, sees:
   - overall session score
   - competency breakdown
   - top strengths and growth areas
   - next practice plan

## Why the feedback feels “smart”
Because every question and score is tied back to the role’s competencies.

---

# Implementation Notes (Minimal risk version)

## Recommended call strategy (fast + consistent)
- Call 1: blueprint
- Call 2: questionPlan
- Call 3: questionText
- For each answer:
  - Call 4: evaluation
  - Call 5: feedback (+ ackPhrase in same response if desired)
- End: session aggregation (no model required)

## Safety defaults
- Always include deterministic fallback ackPhrase
- Always clamp scores 0–100
- If model returns invalid JSON: retry once with a stricter system message

---

# Versioning
- v1: blueprint + questionPlan + scoring + feedback
- v2: adaptive follow-ups + redo drills
- v3: skill streaks + difficulty ramping

