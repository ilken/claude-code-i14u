---
name: dev-workflow
description: Core development workflow for any code change — RALF loop (read, plan, implement, validate), validation commands, self-review checklist, comment and writing rules, model selection, plan grilling, review methodology, worktrees, handoffs, conventional commits, and PR creation. Use at the start of any implementation task, bug fix, or refactor, and when reviewing, committing or opening a PR.
---

# Dev Workflow

Follow the RALF loop for every task. Read the reference docs in this directory as the task reaches each phase — not all upfront.

| When | Read |
| --- | --- |
| Starting any task | `ralf-loop.md` |
| After making changes | `changes-validation.md` — the only copy of the validation commands |
| Writing or re-reading comments | `code-comments.md` |
| Writing a plan, issue, PR body, skill, command or learning | `writing-rules.md` |
| Non-trivial plan (3+ files, data model) | `plan-grilling.md` |
| Choosing a model, handing work to Sonnet or a subagent | `model-selection.md` |
| Reviewing a diff or PR | `code-review.md` |
| Parallel/background work, worktree setup, another repo | `worktree-workflow.md` |
| Snapshotting a plan for later | `handoff.md` |
| A diagram in a PR body or issue comment | `visual-outputs.md` |
| About to patch a dependency | `before-patching-dependencies.md` |
| Before committing | `self-review-checklist.md` + `conventional-commits.md` |
| Opening a PR | `pr-workflow.md` |

## Always-on rules

- **Never commit to `main`/`master`.** Branch as `{user}/{slug}` (`{user}/{issue}-{slug}` from an issue).
- **Plans are files.** Non-trivial approved plans go to `~/Developer/claude-code-i14u/plans/<project>-<slug>.md` with checkboxes.
- **Validate in a loop until green.** Never commit or hand off with known failures.
- **Default to no comment** in code; `bin/pr-check.sh` blocks wordy comments and PR bodies.
- **Capture learnings immediately** when corrected — `~/Developer/claude-code-i14u/skills/memory/learnings.md`.
