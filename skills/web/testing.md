# Testing

Test structure, tools, and patterns for the web project.

---

## Test Types and Locations

| Type            | Location                                         | Tools                        |
| --------------- | ------------------------------------------------ | ---------------------------- |
| Unit tests      | `src/{module}/__tests__/{file}.test.ts`          | Vitest / Jest                |
| Component tests | `src/components/__tests__/{component}.test.tsx`  | RTL, userEvent               |
| Hook tests      | `src/hooks/__tests__/{hook}.test.ts`             | renderHook, RTL              |
| API route tests | `src/app/api/__tests__/{route}.test.ts`          | Vitest / Jest                |
| E2E tests       | `e2e/{flow}.spec.ts`                             | Playwright                   |

## Running Tests

```bash
npm test -- {TEST_FILE_PATH}
```

Run in a loop -- fix failures until all pass.

---

## Unit Tests

- One test file per source file
- Isolated -- mock external dependencies
- Follow: arrange -> act -> assert

## Component Tests

- Use React Testing Library (`@testing-library/react`)
- Test behavior, not implementation -- query by role, text, label (not by class or id)
- Use `userEvent` over `fireEvent` for realistic interactions
- Mock React Query with `QueryClientProvider` wrapper
- Mock GraphQL responses with MSW or custom mocks
- Test: rendering, user interactions, loading states, error states, accessibility

## Hook Tests

- Use `renderHook` from React Testing Library
- Wrap with necessary providers (`QueryClientProvider`, etc.)
- Test state changes, side effects, and return values

## API Route / Integration Tests

- Test request/response cycle with proper HTTP methods
- Test authentication and authorization
- Test input validation (valid, invalid, edge cases)
- Test error responses and status codes
- Mock database and external service calls

## E2E Tests (Playwright)

- Test critical user journeys end-to-end
- Use page object pattern for maintainability
- Test both happy path and key error scenarios
