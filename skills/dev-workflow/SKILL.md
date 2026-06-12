---
name: dev-workflow
description: Core development workflow for any code change — RALF loop (read, plan, implement, validate), validation commands, self-review checklist, conventional commits, and PR creation. Use at the start of any implementation task, bug fix, or refactor, and when committing or opening a PR.
---

# Dev Workflow

Follow the RALF loop for every task. Read the reference docs in this directory as the task reaches each phase — not all upfront.

| When | Read |
| --- | --- |
| Starting any task | `ralf-loop.md` — the full methodology |
| Scope or approach decisions | `gsd-principles.md` — bias to action, cut scope, fail fast |
| After making changes | `changes-validation.md` — validation commands and loop |
| Before committing | `self-review-checklist.md` + `conventional-commits.md` |
| Opening a PR | `pr-workflow.md` |

## Always-on rules

- **Never commit to `main`/`master`.** Check `git branch --show-current`; branch as `{user}/{slug}` first.
- **Plans are files.** For non-trivial tasks, write the approved plan to `~/Developer/claude-code-i14u/plans/<project>-<slug>.md` with checkboxes and tick items off as you implement (details in `ralf-loop.md`).
- **Validate in a loop until green.** Never commit or hand off with known failures.
- **Capture learnings immediately** when corrected — append to `~/Developer/claude-code-i14u/skills/memory/learnings.md`.
