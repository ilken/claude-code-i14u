# Testing Guidelines

## What to Test

Focus testing effort on code with logic, not presentation:

- **Utils** -- pure functions with clear inputs/outputs
- **Transformers** -- data mapping functions
- **Hooks with branching logic** -- hooks that contain conditionals, state transitions, or side-effect orchestration
- **Do NOT test components** unless they contain complex conditional logic not already covered by a hook test

## Test Location

- Co-locate tests in a `__test__/` directory next to the source file
- Use `.spec.ts` / `.spec.tsx` as the file extension (`.test.ts` / `.test.tsx` also accepted)

## Pure Function Tests (Utils / Transformers)

Use `test.each` for functions with multiple input/output cases. Group related cases in a single `describe` block:

```typescript
describe("getTruthyKeys", () => {
  test.each([
    ["basic truthy and falsy values", { a: 1, b: 0 }, ["a"]],
    ["all falsy values", { a: 0, b: false }, []],
  ])("should return keys with truthy values for %s",
    (description, object, expected) => {
      const result = getTruthyKeys(object);
      expect(result).toEqual(expected);
    },
  );
});
```

## Hook Tests

Use `renderHook` from `@testing-library/react-hooks`. Wrap hooks that depend on providers/context in a `TestWrapper` component. Use `act` for state-changing operations. Mock navigation, analytics, and API modules at the top of the file.

```typescript
const TestWrapper: React.FC<PropsWithChildren<object>> = ({ children }) => (
  <NavigationContainer>
    <LocalizationProvider>
      <BlurToastContext.Provider value={{ showToast }}>
        {children}
      </BlurToastContext.Provider>
    </LocalizationProvider>
  </NavigationContainer>
);

describe("useOnTapFollowInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show toast when no followers", () => {
    const { result } = renderHook(
      () => useOnTapFollowInfo({ owner: "owner", statistics: { followers: 0, followees: 10 } }),
      { wrapper: TestWrapper },
    );

    act(() => {
      result.current.onTapFollowersCount();
    });

    expect(showToast).toHaveBeenCalledWith({ title: expect.any(String) });
  });
});
```

## Async / Timer Tests

- Use `jest.useFakeTimers()` for time-dependent logic
- Call `jest.useRealTimers()` in `afterEach`
- Advance timers with `jest.advanceTimersByTime`

## General Rules

- Call `jest.clearAllMocks()` in `beforeEach`
- Keep mocks close to their usage, at the top of the test file
- Prefer `toEqual` for objects/arrays, `toBe` for primitives
- One assertion concept per `it` block when possible

## Running Tests

```bash
yarn test path/to/file.spec.ts
```
