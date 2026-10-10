Get $ARGUMENTS (a PR number, URL, branch, or empty for the current branch) reviewed by a fresh Opus agent, then fix what holds up.

1. **Check out** the branch (a PR: `gh pr checkout <pr>`; in a background session work inside your worktree). Not on `main`.
2. **Review:** run steps 1–3 of the loop in `~/.claude/skills/dev-workflow/code-review.md` (brief `charmander` on opus, triage, debate). Fixing waits for step 4.
3. **Present** `| # | File:Line | Finding | Verdict | Reason |` with what the reviewer withdrew or held, and open disagreements. Wait for the user's go (inside `/ship`, don't wait).
4. **Fix** the agreed queue, then run the loop's re-review on the same agent.
5. **Validate** with the commands in `changes-validation.md`, in a loop until clean.
6. **Learn:** reusable patterns (not one-off fixes) go to `~/Developer/claude-code-i14u/skills/memory/learnings.md`; one the self-review checklist should have caught goes into `self-review-checklist.md`.
7. **Commit** only the changed files (`fix(#N): address review feedback`, scope from the branch) and push. If it's a PR, reply to the PR with a one-line summary of what was fixed, ending 🤖.
