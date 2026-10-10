Advisory review of $ARGUMENTS (a PR number, PR URL, branch, or empty for the current branch against the default branch). Drafts findings, posts only what the user approves. Never edits code — `/code:review-fix` does that.

Method: `~/.claude/skills/dev-workflow/code-review.md` (four axes, what not to flag, severity, posting).

1. **Gather:** for a PR, `gh pr view <pr> --json title,body,headRefName,baseRefName,url,headRefOid` and `gh pr diff <pr>`; for a branch, `git diff origin/<default>...<branch>` and `git log`. Linked issue (`Closes #N`, or the branch number) → `gh issue view <n>` for intent and acceptance criteria.
2. **Standards:** the repo's CLAUDE.md, the stack skill files for the touched areas, `self-review-checklist.md`, `code-comments.md`, and `learnings.md` entries for the project.
3. **Review:** spawn `charmander` with `model: "opus"` carrying the diff, commits, intent, criteria and standards excerpts (it has none of your context). Diffs of 10+ files or 600+ lines: one reviewer per area in parallel, ≤400 words each. Read each finding's code yourself and drop the ones that don't hold.
4. **Present:** `| # | File:Line | Axis | Severity | Draft comment |`, plus any description-vs-diff mismatch. Wait for explicit approval per finding ("post 1, 3", "post all", rewrites).
5. **Post** (PR only) as one review with `event: "COMMENT"` via `gh api -X POST repos/{owner}/{repo}/pulls/{pr}/reviews --input <file>`; un-anchored points go in the review body. Each comment ends with 🤖. Report the review's `html_url`.

Never `APPROVE` or `REQUEST_CHANGES`. The only side effects are GitHub API calls.
