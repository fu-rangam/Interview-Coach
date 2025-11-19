# Test-Driven Development (TDD) Setup

This project follows Test-Driven Development practices to ensure code quality and maintainability.

## Test Structure

### Unit Tests
- **`services/geminiService.test.ts`** - Tests for AI service functions
  - API integration mocking
  - Question generation
  - Audio answer analysis
  - Blob to base64 conversion
  - Error handling and fallbacks

### Component Tests
- **`components/QuestionCard.test.tsx`** - Question card rendering
- **`components/AudioVisualizer.test.tsx`** - Audio visualization
- **`components/Loader.test.tsx`** - Loading state indicators

### Integration Tests
- **`App.test.tsx`** - Full application flow
  - Navigation between screens
  - Role selection
  - Interview workflow
  - Error handling

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Infrastructure

- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Environment**: happy-dom (lightweight DOM implementation)
- **Mocking**: Vitest built-in mocking

## Key Testing Patterns

### 1. Mocking External Dependencies
```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: { ARRAY: 'array', OBJECT: 'object', STRING: 'string' },
}));
```

### 2. Async Testing
```typescript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeDefined();
});
```

### 3. Environment Variables
```typescript
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
```

## TDD Workflow

1. **Write a failing test** - Define expected behavior
2. **Implement minimal code** - Make the test pass
3. **Refactor** - Improve code quality with test safety net
4. **Repeat** - Continue for next feature

## Coverage Goals

Aim for:
- **80%+ line coverage** for critical paths
- **100% coverage** for business logic (services)
- **Focus on behavior** over implementation details

## Best Practices

- ✅ Test user interactions, not implementation
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Test error cases and edge conditions
- ✅ Keep tests independent and isolated
- ❌ Don't test third-party libraries
- ❌ Avoid testing CSS or styling details
