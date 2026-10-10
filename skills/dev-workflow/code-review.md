# Code Review Methodology

How a diff gets reviewed: by `/code:review` (advisory, on any PR), `/code:review-fix` (review then fix), and the review phase of `/ship`. There is no CodeRabbit and no Codex: the reviewer is a **fresh-context Opus agent** (`charmander`), so the model that wrote the code never grades it in the same window.

## Run / Never

- Review in a fresh agent: `Agent({ subagent_type: "charmander", model: "opus" })` § The review loop
- Never `APPROVE` or `REQUEST_CHANGES` on GitHub; `event: "COMMENT"` only, one batched review § Posting
- Never post without the user's approval, except inside `/ship`, which logs instead § Posting
- Every open disagreement ends in the Decision Log, never dropped silently § The review loop

---

## The four axes

Every finding belongs to one.

1. **Logic** — trace each changed function input → output; edge cases the diff introduces (null, empty, async races, error paths); control flow; for SQL, what it returns for users who don't fit the typical row.
2. **Behaviour match** — against the PR description and the linked issue's acceptance criteria. Scope creep? Sub-goals the diff doesn't address?
3. **Simplification & readability** — unused params, one-caller wrappers, dead branches, redundant guards. Smell baseline (Fowler ch. 3), each a judgement call, overridden by a documented project standard: Mysterious Name, Duplicated Code, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Speculative Generality. Inline `as` casts on untrusted data (JSON columns, API payloads, queue jobs) belong behind one parse helper.
4. **Standards** — the project CLAUDE.md, the stack skill files for the touched areas, `self-review-checklist.md`, `code-comments.md`, and `learnings.md`. Every standards finding **cites the source** (file + rule); no citation, no standards finding.

## What NOT to flag

Pre-existing issues in untouched code; style the linter is silent on; anything lint/tsc/prettier/CI already enforces; scope-adding suggestions not needed for correctness; comment noise unless actively misleading.

## Severity

**blocking** (wrong, or breaks a stated requirement) · **suggestion** (works, better option exists) · **question** (intent unclear) · **nit** (default: don't post).

---

## The review loop

1. **Brief the reviewer.** Spawn `charmander` (opus) with everything it needs and nothing it doesn't: the base ref, `git diff <base>...HEAD`, the commit list, the issue's intent and acceptance criteria, the stack skill files to check against, and the instruction to return findings in its handoff format. Large diffs (10+ files or 600+ lines): split by area across parallel reviewers, ≤400 words each.
2. **Triage** each finding: **agree** (fix queue) or **disagree**. Before disputing a standards finding, read the written rule. Matching sibling code is not a counter-argument. A finding that asks for a guard the self-review checklist rules out, or work beyond the acceptance criteria, is a valid disagree: cite the guarantee or the criterion.
3. **Debate** disagreements on the same agent with `SendMessage`: one message with every disputed finding, your reasoning and evidence (`file:line`, the rule, a command's output). Ask it to **withdraw** or **hold** each. Withdrawn → drop. Held → fix if sound, otherwise one more round. Still held after **2 rounds** → you decide, and it goes in the Decision Log as an **open disagreement** for the user.
4. **Fix** the queue, validate, commit.
5. **Re-review** on the same agent: "I pushed fixes in `<sha range>`; review only that diff and say whether each agreed finding is resolved." One re-review per cycle, so settled items aren't re-raised.

If the `Agent` tool is unavailable (inside a subagent), run the four axes yourself with `git diff` re-read cold, and say so in the summary.

---

## Posting (advisory `/code:review`)

Present a table first: `| # | File:Line | Axis | Severity | Draft comment |`, plus any description-vs-diff mismatch. Post only what the user approves, as **one** review:

```bash
gh api -X POST repos/{owner}/{repo}/pulls/{pr}/reviews --input review.json   # {commit_id, event:"COMMENT", comments:[{path,line,side:"RIGHT",body}]}
```

Lead each comment with the concrete observation, suggest a fix (```suggestion blocks for trivial edits), end with 🤖. Cross-cutting points go in the review `body`.
