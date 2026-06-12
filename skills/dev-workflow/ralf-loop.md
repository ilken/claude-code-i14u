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

**This phase is never optional.** Even when a pre-approved plan is provided (e.g. from plan mode), always run the Read phase. At minimum, load `changes-validation.md` to get the correct validation commands for the project. Skipping Read leads to wrong commands and missed workflow steps (commit, PR).

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
5. **Write the approved plan to a file** -- for non-trivial tasks (multi-step,
   multi-module, or anything likely to span a long session), save the plan to
   `~/Developer/claude-code-i14u/plans/<project>-<slug>.md` with checkbox steps.
   Tick items off as you implement. The plan file survives compaction and
   crashes; the chat message does not.

Keep the plan minimal. If the task is simple, a mental checklist is enough -- do not over-plan.

---

## L -- Lint + Implement

Write the code, then validate in a loop until clean:

1. **Test first for bug fixes** -- before fixing a bug, write a failing test that
   reproduces it. The fix is done when the test passes. For new features, write
   tests alongside the implementation, not as an afterthought.
2. **Implement** the changes following the plan
3. **Run validation commands** for the project -- see `changes-validation.md`
   for the per-project commands and the generic fallback
4. **Fix any errors** -- lint, type, test failures
5. **Repeat** steps 3-4 until all checks pass
6. **Self-review** -- run through `self-review-checklist.md` to catch issues that linting misses but reviewers flag (inline types, missing try-catch, redundant queries, etc.)
7. **Commit** after each logical unit of work -- don't batch everything into one big commit at the end. Each step of the plan or cohesive file group should be its own commit.

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

1. **Verify behavior, not just checks** -- for user-facing changes (UI, CLI,
   API behavior), run the app and observe the change working (the `/verify`
   skill automates this). Lint-clean does not mean it works.
2. **Summarize** what was done -- files changed, decisions made, anything noteworthy
3. **Note learnings** -- if you discovered something useful, append it to memory
4. **Push and create a PR** -- push the branch and open a PR (see `pr-workflow.md` for format). Commits should already exist from the Implement phase.
5. **Flag open questions** -- anything that needs follow-up or user decision

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
