Autonomously ship $ARGUMENTS end to end: read + plan → implement → design check → Opus review → PR → watch CI → fix → repeat until green → notify. No approval stops. Built to run as a background session from the agents view.

## Autonomous overrides (apply throughout)

- **Never wait for the user** at any gate in the skills or commands this chains (`git:pr`, `dev-workflow`). Make the call; when there's a real choice take the **simplest option** that meets the acceptance criteria, and record every non-obvious call in a running **Decision Log**.
- **Hard rules:** never commit to `main`/`master`, **never merge the PR**, never `APPROVE`/`REQUEST_CHANGES` on GitHub. Force-push only as `git push --force-with-lease` on this run's own branch after a rebase.
- **Resumable:** if a branch (`ilken/<n>-*`) or open PR for this issue exists, adopt it and resume at the matching phase (no PR → Phase 2; PR → Phase 4).
- **Abort to Phase 6 as needs-attention** (don't guess) only for: a destructive or irreversible step (dropping columns, prod data changes, deleting user data), an issue too ambiguous for a safe default, a needed secret/console/account change no code can make, or a cap below.
- **Waiting:** foreground `sleep` is blocked. Wait with a background Bash task or `Monitor` and act when it completes; never busy-wait. Keep one model for the whole run (`dev-workflow/model-selection.md`).

## Phase 1 — Read + Plan

1. Resolve `$ARGUMENTS`: an issue number (`42`, `#42`), an issue URL, or a description. A description becomes an issue first (`gh issue create --assignee @me`) so the plan and `Closes #N` have a home. Empty → ask and stop.
2. `gh issue view <n> --comments`: title, body, acceptance criteria, `Blocked by #N` (an open blocker → needs-attention). Run the RALF Read phase (`dev-workflow/ralf-loop.md`), always loading `changes-validation.md`.
3. Isolation: a background session is already in a worktree, else `EnterWorktree`. Name the branch `ilken/<n>-<slug>` (`git branch -m`) and set the worktree up per `dev-workflow/worktree-workflow.md`.
4. Plan to the plan output standard. Non-trivial (3+ files, modules or data model) → `plan-grilling.md`, answering the questions yourself; log the answers.
5. Post the plan as an issue comment (`gh issue comment`): approach, files touched, edge cases, tests, plain sentences (`writing-rules.md` §3), one diagram if 3+ files (`visual-outputs.md`). The issue is the audit trail nobody approved live.

## Phase 2 — Implement

6. Implement step by step. After each logical unit: validate (`changes-validation.md`), fix in a loop, commit (`conventional-commits.md`, scope `#<n>`). Before the last commit: full validation, `self-review-checklist.md`, `bin/pr-check.sh`.
7. **Design check** — skip silently for non-visual changes.
   - Web, user-visible change → `browser-qa` skill (extension, else its Playwright fallback). Neither works → flag **design-check-pending** with the reason.
   - App, design link or visual criteria → `xcrun simctl list devices booted`. Booted → `app-dev/sim-qa.md`; not booted → don't boot one, flag **design-check-pending**.
   - With a Figma link, compare against the frames. Fixes go through validate → commit; outcome in the Decision Log.
8. **Opus review** — run the loop in `dev-workflow/code-review.md` against `origin/<default>`: fresh `charmander` agent on opus, triage, debate (2 rounds max), fix, one re-review. Run any test suite wider than the changed specs as a background task beside it. Open disagreements go in the Decision Log.

## Phase 3 — PR

9. Follow `~/.claude/commands/git/pr.md` without waits; body ends `Closes #<n>`. Capture the PR number and URL.

## Phase 4 — CI

10. No `.github/workflows/` in the repo and no checks on the PR 3 minutes after the push → **no CI**: log it and go to Phase 5.
11. Watch with a background task: `gh pr checks <pr> --watch --fail-fast`; then read the final state with `gh pr checks <pr>`.
12. Red: read the failure with `gh run view <run-id> --log-failed` (job logs first, then the test names). One clear flake (network, timeout) → `gh run rerun <run-id> --failed` once. Otherwise reproduce locally, fix, validate, commit `fix(#<n>): <what>`, push, restart this phase. If the fix changed logic, re-review on the same `charmander` agent.
13. **Cap: 5 CI-fix pushes.** Beyond → Phase 6 needs-attention.

## Phase 5 — Loop until green

14. Each cycle: `gh pr view <pr> --json mergeable,mergeStateStatus`. Conflicting with a moved main → rebase onto `origin/<default>`, resolve mechanical conflicts, regenerate generated code, `git push --force-with-lease`, back to Phase 4. A semantic conflict → needs-attention.
15. **Green** = required checks pass (or no CI), review fix queue empty, PR mergeable. **Cap: 5 full cycles.**

## Phase 6 — Notify + summary

16. `PushNotification` (load it with ToolSearch): `✅ #<n> green — <PR URL>`, `✅ #<n> green — needs manual design check — <PR URL>`, or `⚠️ #<n> needs attention — <reason>`.
17. Final summary: what shipped, PR link and check state, the Decision Log, review disagreements (resolved and open), whether CI or the design check was skipped and why, and manual follow-ups (env vars, store/console steps, the pending design check). Leave the PR for the user to merge.
18. Learnings: none → skip. Otherwise spawn one background `Agent` (`model: "sonnet"`, `isolation: "worktree"`) on `~/Developer/claude-code-i14u` with each lesson as 1–3 decided bullets, its source (PR, `path#symbol`) and target (`skills/memory/learnings.md` or a skill file), following `writing-rules.md`, then PR + merge per the auto-merge rule in CLAUDE.md. Relay its PR link.
