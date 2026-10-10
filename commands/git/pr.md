Create a pull request following `dev-workflow/pr-workflow.md`.

1. **Pre-flight:** `git status` clean, not on `main`/`master`, branch pushed (`git push -u origin HEAD`).
2. **Context:** issue number from the branch (`ilken/42-slug` → `#42`) or `$ARGUMENTS`; `git log --oneline origin/<default>..HEAD`; `git diff origin/<default>...HEAD --stat`.
3. **Title:** `type(#42): short description` — max 70 chars, imperative, lowercase; no scope without an issue.
4. **Body:** template and caps in `pr-workflow.md` — one bullet per point, 140 chars a bullet, 35 lines, no paragraphs, `Closes #42`, the session's attribution footer.
5. **Check:** write the body to a temp file (`$CLAUDE_JOB_DIR/tmp/pr-body.md` in a background job) and run `~/Developer/claude-code-i14u/bin/pr-check.sh --body <file>`. Fix everything: a long comment means editing the code and amending; a long body line means rewriting it. The same check runs as a `gh pr create` hook.
6. **Create:** `gh pr create --title "..." --body-file <file>`.
7. **Output:** the PR URL.
