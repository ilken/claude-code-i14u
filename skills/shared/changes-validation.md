# Changes Validation

Validation commands to run before committing changes. Run in a loop, fixing issues until all checks pass.

---

## Backend (equals-client-be)

### Code Quality
```bash
yarn code:full-lint
```

### Tests
```bash
yarn test:local -- {TEST_FILE_PATH}
```

Example:
```bash
yarn test:local -- src/profile-notification/notification-builder/__test__/my-notification.builder.spec.ts
```

**Note:** Only one `test:local` process can run at a time. Redis is shared across runs, so concurrent executions will interfere with each other.

---

## App (equals-client-app)

### Code Quality
```bash
yarn code:full-lint
```

This runs prettier, eslint, and TypeScript type-checking (`yarn code:prettier && yarn code:lint && yarn code:tsc`).

### Tests
```bash
yarn test {TEST_FILE_PATH}
```

Example:
```bash
yarn test src/utils/__tests__/formatDate.test.ts
```

---

## Web (Next.js)

### Code Quality
```bash
npm run lint && npm run typecheck && npm run build
```

### Tests
```bash
npm test -- {TEST_FILE_PATH}
```

---

## Validation Loop

1. Run the validation command for your project
2. Read the errors carefully
3. Fix the issues
4. Run again
5. Repeat until clean

Do not commit or hand off with known failures.

---

## Behavioral Diff Verification

After validation passes, run a final check for **refactors and behavior-changing edits**:

```bash
git diff
```

Review the diff holistically and verify:
- No unintended behavioral side effects (e.g., changed return values, removed error handling, altered control flow)
- No accidental deletions of code that should have been kept
- Changes are scoped to what was planned — nothing extra crept in

**When to do this:** Refactors, logic changes, and any edit that alters runtime behavior. Skip for pure additions (new files, new tests) or cosmetic changes (formatting, comments).

If you spot an unintended change, fix it and re-run validation before committing.
