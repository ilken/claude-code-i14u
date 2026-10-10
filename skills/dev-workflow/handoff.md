# Handoff Documents

A handoff is the snapshot at the end of a plan session: the **only** thing the next agent needs to read to implement without re-litigating decisions. The implementer may be Claude Code, Cursor or a human, so every doc is **self-contained** (no critical fact only behind an `{i14u}` path) and **tool-neutral** (plain git/yarn commands, no Claude tool names).

Invoked by `/handoff`; listed by `/handoff:list`.

## Run / Never

- Never write a handoff before planning has happened; ask for the task instead
- Never invent a decision; write `TBD:` under open questions
- Save only to `~/.claude/handoffs/`, never a repo's `.claude/`
- One doc per task plus an index when a session planned several
- With a GitHub issue, also post Plan + Decisions + Out of scope as an issue comment

---

## Files

`~/.claude/handoffs/handoff-<project>-<slug>-<YYYY-MM-DD-HHMM>.md` — `<project>` is the repo directory name of the repo the **work** belongs to (not the cwd); `<slug>` is `issue-42`, else a kebab title (~40 chars), else 3–5 topic words.

**Status** line, one of `pending` (set at creation) → `in-development` → `completed` (set by the implementer). It is the only line an implementer edits.

**Multi-task:** one doc per task, scoped strictly; each stands alone (duplicate shared facts); plus `handoff-index-<timestamp>.md` listing per task: file, repo, one-line goal, branch, dependencies/order, or "independent".

## Template

```markdown
# Handoff: <one-line title>

**Created:** YYYY-MM-DD HH:MM
**Status:** pending
**Project:** <repo>
**Branch:** `<existing>` or **Create new:** `<suggested>`
**Issue:** <owner/repo#N URL> — or `—`
**Depends on:** <sibling handoff or branch> — multi-task sets only

## Goal
What and **why**, one paragraph.

## Success criteria
- [ ] Objectively checkable, user-visible where UI is involved

## Plan
1. **Step** — what, with file paths.

## Files to touch
**Edit:** `path` — note · **Create:** `path` — purpose · **Delete:** `path` — why safe

## Key facts (inline — read even if you load nothing else)
- Validation commands, conventions, gotchas the plan depends on

## Context to load (optional enrichment — no critical fact only here)
- `path/to/pattern.ts` — what shape to copy

## Decisions made
- **Chose X over Y** — reason

## Out of scope
- ...

## Validation
- Commands, manual checks, tests to add

## Notes / open questions
- ...

---
*Resume (Claude Code):* `Read the handoff at ~/.claude/handoffs/<file>.md and implement it following the RALF loop in CLAUDE.md. Update its Status line to in-development when you start and completed when done.`
*Resume (Cursor):* `Implement the plan in ~/.claude/handoffs/<file>.md as the approved spec: don't re-litigate decisions, respect out of scope, validate until green, raise open questions first. Update its Status line as you go.`
```

## Synthesis rules

Compress, don't transcribe. Preserve the *why* of every decision. Be honest about gaps (`TBD:`). Surface unresolved forks under open questions. Full paths from the repo root. Aim for one page.
