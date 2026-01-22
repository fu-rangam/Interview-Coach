# Testing Strategy

We follow a "Testing Pyramid" approach to ensure production quality with high confidence and fast feedback loops.

## 1. Unit Tests (Vitest)

**Goal:** Verify individual functions, hooks, and isolated logic.

- **Tools:** `vitest`, `@testing-library/react`, `node-mocks-http`
- **Location:** `src/**/*.test.ts`, `tests/api/*.test.ts`
- **What we test:**
  - API Handlers (Mocked Auth/DB)
  - React Hooks (`useSession`, `useRecording`)
  - Utility functions (`encryption`, `sanitize`)

**Run Unit Tests:**

```bash
npm test
```

## 2. UI Component Snapshots (Vitest)

**Goal:** Prevent regression in reusable UI components design.

- **Tools:** `vitest` snapshotting
- **Location:** `src/components/ui/**/*.test.tsx`
- **What we test:**
  - `GlassCard`, `GlassButton`, `GlassInput` rendering.
  - Ensures fundamental design system changes are intentional.

**Run Snapshots:**

```bash
npx vitest run src/components/ui/glass/GlassComponents.test.tsx
```

## 3. End-to-End (E2E) Smoke Tests (Playwright)

**Goal:** Verify the app works as a black box from the user's perspective.

- **Tools:** `playwright`
- **Location:** `tests/e2e/*.spec.ts`
- **What we test:**
  - App initialization (Home -> Start).
  - Critical user flows (Navigation).
  - "Can a user actually reach the functionality?"

**Run E2E Tests:**

```bash
npx playwright test
```

---

## ⚠️ Recommendation: Live API Testing

While our API Unit tests are robust, they rely on **mocks** of Google Gemini and Supabase.
**WE RECOMMEND:** Configuring at least ONE automated test that runs on a schedule (e.g., nightly CI) using **REAL API KEYS**.

- **Why:** To detect if Google/Supabase changes their API contract or if our keys expire.
- **How:** Create `tests/live/integration.spec.ts` that hits the `generate-questions` endpoint with a real key and asserts a 200 OK response.
