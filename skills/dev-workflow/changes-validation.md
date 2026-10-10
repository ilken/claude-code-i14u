# Changes Validation

The only copy of the validation commands — never restate them in a skill or command file. Run in a loop until clean. A project's own CLAUDE.md overrides this file.

---

## Backend (NestJS)

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

## App (Expo / React Native)

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
yarn lint && yarn typecheck && yarn build
```

### Tests
```bash
yarn test {TEST_FILE_PATH}
```

---

## Any Other Project

Check `package.json` scripts (or the project's CLAUDE.md) and run, in order of
availability: lint, typecheck/tsc, tests touching the changed files, build.
Use the project's own package manager — default to yarn when ambiguous.

---

## Real-page verification

Lint, types and unit tests cannot see layout, hydration, runtime console errors or a logged-in view. For any **user-visible** web change, validate first, then open the page (`browser-qa` skill, or `/web:qa <route>`). For app screens, `app-dev/sim-qa.md`. Skip for pure logic, backend-only work and refactors with no visual surface.

## Sandbox binary fallback

`yarn lint` / `yarn tsc` can fail with `command not found: eslint` even with `node_modules/.bin` populated. Invoke through node: `node node_modules/eslint/bin/eslint.js …`, `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/jest/bin/jest.js --runInBand <path>`. In Yarn 4 repos, Homebrew's yarn 1 can shadow corepack: call yarn by the nvm absolute path.

---

## Validation Loop

1. Run the validation command for your project
2. Read the errors carefully
3. Fix the issues
4. Run again
5. Repeat until clean

Do not commit or hand off with known failures.

---

## Automate It Per Project (Recommended)

Instructions can be forgotten; hooks cannot. In each project's
`.claude/settings.json`, add a `Stop` hook that runs the project's typecheck
when a session finishes making changes, feeding failures back automatically:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && if ! git diff --quiet 2>/dev/null; then yarn --silent tsc --noEmit 2>&1 | tail -20; fi"
          }
        ]
      }
    ]
  }
}
```

Adjust the command to the project's validation script (e.g.
`yarn code:full-lint` for backend/app projects). Keep it fast — typecheck or
lint-on-changed-files, not the full test suite.

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
