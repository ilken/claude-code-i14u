# PR Workflow

How to create pull requests consistently across all projects.

---

## PR Title

Mirrors the conventional commit format:

```
type(#123): short description
```

- Same types as commits: `feat`, `fix`, `chore`, `refactor`, `hotfix`
- Include GitHub issue number as scope when working from an issue; omit otherwise
- Max 70 characters
- Imperative, lowercase

---

## PR Description Template

```markdown
## Summary
- Brief description of what this PR does and why

## Changes
- List of key changes made
- Grouped by area if touching multiple modules

## Testing
- [ ] How the changes were validated
- [ ] Manual testing steps if applicable
- [ ] Tests added or updated

Closes #XXX
```

---

## Description Rules

One bullet per point, the point first. Nobody reads a PR body, they scan it.

| Rule | Cap |
|---|---|
| One line per bullet | 140 chars |
| Prose lines in a row, anywhere | 2 |
| Whole body | 35 lines |

Say **what changed and why**; the diff carries the how. No background section, no narration of rejected approaches, no restating the issue. A change across 2+ modules may add one Mermaid diagram drawn from the final diff (`visual-outputs.md`). End the body with the attribution footer the session's instructions give.

`bin/pr-check.sh --body <file>` enforces the caps and also checks the branch diff for over-long comments. The `gh pr create` hook runs it on every PR. **Never set `PR_CHECK_OFF` to get past it** — that switch is the user's, not Claude's.

---

## Self-Review Checklist

Before requesting review:
- [ ] `bin/pr-check.sh --body <file>` is clean
- [ ] Diff contains only intended changes (no debug logs, commented code, unrelated formatting)
- [ ] Validation commands pass (lint, types, tests)
- [ ] New code follows project conventions (check relevant skill files)
- [ ] No secrets, credentials, or sensitive data in the diff

---

## CLI Usage

Write the body to a file first so `pr-check` can read it (in a background job use `$CLAUDE_JOB_DIR/tmp`):

```bash
~/Developer/claude-code-i14u/bin/pr-check.sh --body "$CLAUDE_JOB_DIR/tmp/pr-body.md"
gh pr create --title "type(#123): description" --body-file "$CLAUDE_JOB_DIR/tmp/pr-body.md"
```

Inline form:

```bash
gh pr create \
  --title "type(#123): description" \
  --body "$(cat <<'EOF'
## Summary
- ...

## Changes
- ...

## Testing
- [ ] ...

Closes #123
EOF
)"
```

### Useful Commands

```bash
# Create PR targeting main
gh pr create --base main

# Create draft PR
gh pr create --draft

# View PR status
gh pr status

# Add reviewers
gh pr edit --add-reviewer @username
```

---

## Branch to PR Flow

1. Ensure all changes are committed
2. Push branch to origin: `git push -u origin HEAD`
3. Create PR with `gh pr create`
4. Include `Closes #XXX` to auto-close the GitHub issue when the PR merges
