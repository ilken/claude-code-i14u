# RALF Loop

Every task follows: **Read → Analyse + Plan → Implement + Lint → Feedback**.

This file holds only the deltas on top of Claude Code's native behaviour (plan mode, validation loops, verification). Don't restate the basics — follow them; add these on top.

---

## R -- Read

**Never optional — even with a pre-approved plan.** Skipping Read leads to wrong validation commands and missed workflow steps (commit, PR). Minimum load-out:

1. `changes-validation.md` — the project's validation commands
2. The project's own CLAUDE.md and the matching stack skill (`app-dev`, `backend-dev`, `web-dev`), lazily — only the docs the task touches
3. `~/Developer/claude-code-i14u/skills/memory/learnings.md` — grep for the project name and the area
4. The GitHub issue if there is one: `gh issue view <n> --comments`

**Batch only independent reads.** Locate first (grep/glob), then open only what the hits point to; never pre-load a file on a guess. Writes, edits and git stay one at a time.

---

## A -- Analyse + Plan

Get user approval before implementing non-trivial changes (the autonomous bug-fix criteria in CLAUDE.md are the exception). Keep plans minimal for simple tasks. Run `plan-grilling.md` on plans touching 3+ files, several modules or the data model.

### Plan output standard

The *depth* of the plan depends on **who implements it**:

- **You, same session** → a light checklist is fine; you carry the context.
- **A context-free executor** — Sonnet (`model-selection.md`), a subagent, a fresh session, Cursor → the plan must be a **complete spec**. Anything left to "figure out later" will be figured out wrong.

A Sonnet-proof plan leaves **zero decisions** to the implementer:

1. **Exact file paths** for every edit/create/delete — never "the relevant service"
2. **An existing pattern to mirror** for each change — a concrete file/function to copy the shape from. The single biggest error-preventer.
3. **Explicit out-of-scope list**
4. **Exact validation commands** and what green looks like
5. **Decisions already made**, with rationale, so the executor doesn't re-litigate
6. **Named edge cases / error states**
7. **Existing code reused** for every new helper, column or dependency: say what you searched for and why it does not fit. A bug fix greps every caller and fixes the shared function, not only the path the issue names.

A plan handed off rather than implemented in-session goes into the `handoff.md` template.

---

## L -- Implement + Lint

1. **Test first for bug fixes** — a failing test that reproduces it; done when it passes.
2. Validate with the **project's** commands and loop until green (`changes-validation.md` is the only copy; don't restate them).
3. **Self-review** via `self-review-checklist.md`.
4. **Read every comment in the diff** and delete the ones that narrate (`code-comments.md`). Run `bin/pr-check.sh` here, not at `gh pr create` where the hook blocks the PR.
5. **Commit after each logical unit of work** — never one big commit at the end.

### Mid-implementation re-plan triggers

Stop coding and re-plan (summarize what you learned, present a revised plan, wait for approval) on any of:

- **Wrong assumptions** — the code doesn't behave as the analysis predicted
- **Scope explosion** — significantly more files/modules than planned
- **2 failed attempts** on the same sub-problem (also a model-escalation trigger)

---

## F -- Feedback

Everything written here follows `writing-rules.md`.

1. **Verify behaviour, not just checks** — for user-facing changes run it and look (`browser-qa` for web, `app-dev/sim-qa.md` for the app).
2. **Summarize** — files changed, decisions made, anything noteworthy.
3. **Capture learnings** — `learnings.md`, ≤10-line entries, merged to `main` the same turn (CLAUDE.md auto-merge rule). Capture corrections the moment they happen.
4. **Push and create a PR** — `pr-workflow.md`.
5. **Flag open questions** — anything needing follow-up or a user decision.
