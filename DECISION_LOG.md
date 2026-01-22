# Decision Log (ADR-lite)

Purpose:

- Capture architecturally significant decisions
- Provide "why" alongside "what"
- Make senior engineer review easy
- Enable reversal without confusion (decisions can be superseded, not deleted)

Format:

- Keep entries small
- Include alternatives considered
- Include consequences / tradeoffs

---

## Template

### [0001] <Decision Title>

**Status:** Accepted | Superseded | Rejected  
**Date:** YYYY-MM-DD

**Context:**

- What requirement or constraint triggered this decision?

**Decision:**

- What are we doing?

**Alternatives considered:**

1.
2.
3.

**Why this choice:**

- Why is this best given our constraints?

**Consequences / tradeoffs:**

- Pros:
- Cons:
- Follow-ups:

**Revisit if:**

- What conditions would change this decision?

---

## Decisions

### [0001] Example: Use JSONL for agent tool tracing logs

**Status:** Accepted  
**Date:** YYYY-MM-DD

**Context:**
We need append-only logs that can be parsed line-by-line during agent loops.

**Decision:**
Store tool calls in `.ralph/tool_trace.jsonl` (newline-delimited JSON objects).

**Alternatives considered:**

1. Single JSON array file rewritten each loop
2. Plain text logs only

**Why this choice:**
JSON Lines supports incremental writing and streaming processing.

**Consequences / tradeoffs:**

- Pros: append-only, easy to parse per record
- Cons: not “one valid JSON document” end-to-end

**Revisit if:**
We require strict JSON documents for ingestion into a system that rejects JSONL.

### [0002] Add Unique ID to InterviewSession

**Status:** Accepted
**Date:** 2026-01-13

**Context:**
Users reported "ghosting" where old session state (answers/transcripts) appeared in new sessions. The existing `InterviewSession` type lacked a unique identifier to reliably distinguish strictly between "reset" sessions and "new" sessions across component mounts.

**Decision:**
Add an optional `id` fields (UUID) to the `InterviewSession` interface.

**Alternatives considered:**

1. Rely on `currentQuestionIndex === 0` (fragile)
2. Rely on `answers` object emptiness (unreliable if persistence lags)

**Why this choice:**
Explicit ID allows components to subscribe to `session.id` changes and force-reset local state immediately.

**Consequences / tradeoffs:**

- Pros: Deterministic cleanup triggers.
- Cons: Minor migration friction for existing persisted sessions (optional field mitigates this).

**Revisit if:**
We move to a fully server-side session management model where local ID is irrelevant.

### [0003] Move Client-Side Encryption to Per-Device Key

**Status:** Accepted
**Date:** 2026-01-22

**Context:**
Using VITE_SUPABASE_ANON_KEY for client-side encryption provides zero security against anyone with the source code.

**Decision:**
Generate a unique random key per browser (stored in localStorage) and use it for encrypting sensitive session data. Maintain backward compatibility by attempting decryption with the legacy key if the new key fails.

**Alternatives considered:**

1. Server-side encryption (Requires auth for all users, breaks Guest mode).
2. User-provided password (Too much friction).

**Why this choice:**
Significantly prevents "global key" attacks while maintaining Guest persistence functionality.

**Consequences / tradeoffs:**

- Pros: Unique key per user, better obfuscation.
- Cons: Key is still in localStorage (vulnerable to XSS/local access).

**Revisit if:**
We implement fully authenticated-only sessions or server-side session management for guests.

### [0004] Enforce Request Size Limit for Audio Analysis

**Status:** Accepted
**Date:** 2026-01-22

**Context:**
The 'analyze-answer' API endpoint accepted base64 audio payloads of unlimited size, posing a potential DoS / memory abuse risk.

**Decision:**
Enforce a hard limit of 10MB for \input.data\ (base64) in the \nalyze-answer\ endpoint. Return 413 Payload Too Large if exceeded.

**Alternatives considered:**

1. Configure Vercel/Next.js body parser limits (Might be too broad or bypassed if custom parser is used).
2. Stream processing (Too complex for current architecture).

**Why this choice:**
Simple application-level check protecting the specific heavy resource (Gemini API / Memory).

**Consequences / tradeoffs:**

- Pros: Prevents massive payloads.
- Cons: Rejects valid >10MB recordings (which would be >7 mins, unlikely for interview answers).

**Revisit if:**
Users legitimately need to upload very long interview answers.

### [0005] Enforce Runtime Schema Validation (Zod)

**Status:** Accepted
**Date:** 2026-01-22

**Context:**
API endpoints (`init-session`, `generate-questions`, `analyze-answer`) previously relied on loose checks (e.g., `if (!role)`) and permissive types. This risked malformed data reaching the AI service or causing runtime errors, and lacked clear documentation of expected inputs.

**Decision:**
Implement `zod` schema validation for all API request bodies. Return `400 Bad Request` immediately if validation fails.

**Alternatives considered:**

1. Manual type guards (Verbose, harder to maintain).
2. `io-ts` (More complex syntax).
3. Rely on TypeScript types mostly (No runtime protection).

**Why this choice:**
Zod provides a clean, chainable API for defining schemas that can infer TypeScript types, ensuring runtime safety matches compile-time expectations.

**Consequences / tradeoffs:**

- Pros: Catches invalid requests early, preventing wasted AI tokens and runtime crashes.
- Cons: Adds a small runtime overhead (start-up and parsing). Requires keeping schemas in sync with frontend types.

**Revisit if:**
We switch to a framework like tRPC which handles this validation natively, or if performance overhead becomes measurable (unlikely).
