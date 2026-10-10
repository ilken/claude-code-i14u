Generate a QA checklist for $ARGUMENTS that a non-technical tester can follow step by step. Testers tap, swipe, type and navigate; they don't read code, run commands or check databases. Write for them.

## Context

1. `$ARGUMENTS` is an issue (`#42`, URL → `gh issue view --comments`), a PR (`gh pr view` + `gh pr diff`), or a plain description.
2. With an issue or PR, read the changes: which screens, flows and states are affected, which edge cases the code handles — those map to things to verify.

## Checklist

**Setup** — only what's needed: accounts (e.g. "two test accounts that don't follow each other"), state ("one account with at least 3 posts"), platform/device notes.

**Test scenarios** — grouped by real user journeys, each with a short title and numbered `- [ ]` steps in plain sentences (`~/.claude/skills/dev-workflow/writing-rules.md` §3): plain verbs (Tap, Swipe, Type, Open, Go to), exact places ("the heart icon below the post"), and what should happen after each action, in "you" language.

> Good: 3. Tap "Send" → the message appears with a small clock icon; after 1–2 seconds it becomes a checkmark.
> Bad: 3. Verify the message delivery state transitions through the status enum.

Cover the happy path, empty states, error states (no internet, invalid input), edge cases (long text, special characters, rapid taps, back mid-flow) and regression spots next to the change.

Never include response codes, database state, logs, dev tools, jargon ("mutation", "cache"), implementation details, or anything needing code changes or flags.

## Output

Clean markdown: a one-line summary of the feature, Setup, the scenarios, then a **Regression smoke test** with 3–5 quick checks on related features.
