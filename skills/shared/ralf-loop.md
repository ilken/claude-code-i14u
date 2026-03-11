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
   - App: `yarn code:full-lint`
   - Web: `npm run lint && npm run typecheck && npm run build`
3. **Fix any errors** -- lint, type, test failures
4. **Repeat** steps 2-3 until all checks pass
5. **Commit** after each logical unit of work -- don't batch everything into one big commit at the end. Each step of the plan or cohesive file group should be its own commit.

Do not move on with known failures. The loop ends when validation is green.

### Mid-Implementation Re-Plan

If any of these triggers occur during implementation, **stop coding and re-plan**:

- **Wrong assumptions** — the code does not work as expected based on the original analysis
- **Scope explosion** — the change requires significantly more files or modules than planned
- **2 failed attempts** — two different approaches to the same sub-problem have failed

When triggered:
1. Stop implementation
2. Summarize what you learned and what went wrong
3. Present a revised plan to the user
4. Wait for approval before resuming

This is not a failure — it is the plan adapting to reality.

---

## F -- Feedback

Wrap up the task cleanly:

1. **Summarize** what was done -- files changed, decisions made, anything noteworthy
2. **Note learnings** -- if you discovered something useful, append it to memory
3. **Push and create a PR** -- push the branch and open a PR (see `shared/pr-workflow.md` for format). Commits should already exist from the Implement phase.
4. **Flag open questions** -- anything that needs follow-up or user decision

### Immediate Learning Capture

Do not wait for Feedback to capture learnings. If the user corrects you mid-task or you discover something important during implementation, update `learnings.md` immediately. The Feedback phase captures final learnings; corrections and surprises should be recorded as they happen.

---

## Quick Reference

| Phase   | Action                          | Output                    |
| ------- | ------------------------------- | ------------------------- |
| Read    | Gather context                  | Understanding             |
| Analyse | Plan the approach               | Ordered steps + approval  |
| Lint    | Code + validate + commit in a loop | Green checks           |
| Feedback| Summarize + push + PR + learnings   | Clean deliverable     |
