# RALF Loop

A structured methodology for completing tasks with consistency and quality.
Every task follows this cycle: **Read -> Analyse -> Lint -> Feedback**.

---

## R -- Read

Before writing any code, gather full context:

1. Read the task description and acceptance criteria
2. Read all referenced files and modules
3. Read relevant skills for the project (conventions, patterns, validation commands)
4. Read memory/learnings for prior context on similar work

Do not start coding until you understand what is being asked and where it fits.

---

## A -- Analyse + Plan

Assess the scope and form a plan before implementation:

1. **Assess complexity** -- is this a one-file change or a multi-module feature?
2. **Identify affected areas** -- which files, modules, and tests are involved?
3. **Create an implementation plan** with ordered steps:
   - What to change and where
   - What new files (if any) to create
   - What tests to write or update
   - What validation to run
4. **Get user approval** before proceeding (for non-trivial changes)

Keep the plan minimal. If the task is simple, a mental checklist is enough -- do not over-plan.

---

## L -- Lint + Implement

Write the code, then validate in a loop until clean:

1. **Implement** the changes following the plan
2. **Run validation commands** for the project:
   - Backend: `yarn code:full-lint && yarn test:local -- {file}`
   - App: `yarn code:lint && yarn code:tsc`
   - Web: `npm run lint && npm run typecheck && npm run build`
3. **Fix any errors** -- lint, type, test failures
4. **Repeat** steps 2-3 until all checks pass

Do not move on with known failures. The loop ends when validation is green.

---

## F -- Feedback

Wrap up the task cleanly:

1. **Summarize** what was done -- files changed, decisions made, anything noteworthy
2. **Note learnings** -- if you discovered something useful, append it to memory
3. **Create a conventional commit** following the project's commit format:
   ```
   type(EQLS-XXXX): description in imperative present-tense
   ```
4. **Flag open questions** -- anything that needs follow-up or user decision

---

## Quick Reference

| Phase   | Action                          | Output                    |
| ------- | ------------------------------- | ------------------------- |
| Read    | Gather context                  | Understanding             |
| Analyse | Plan the approach               | Ordered steps + approval  |
| Lint    | Code + validate in a loop       | Green checks              |
| Feedback| Summarize + commit + learnings  | Clean deliverable         |
