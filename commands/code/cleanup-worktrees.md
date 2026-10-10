Clean up worktrees under `.claude/worktrees/` (in every repo under `~/Developer/`) whose PRs merged or closed.

1. Run `~/Developer/claude-code-i14u/bin/cleanup-worktrees.sh --verbose`, appending `--dry-run` if `$ARGUMENTS` contains it.
2. Report the summary line's counts: `removed`, `kept_open`, `kept_no_pr`, `dirty_skipped`, `errors`.
3. Any `kept_no_pr`, `dirty_skipped` or `errors` → show the relevant lines of `tail -100 ~/.claude/cleanup-worktrees.log` and say which worktrees need attention and why.
4. **Never** force-remove a dirty worktree for the user; suggest they inspect it.
