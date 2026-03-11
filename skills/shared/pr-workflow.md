# PR Workflow

How to create pull requests consistently across all projects.

---

## PR Title

Mirrors the conventional commit format:

```
type(EQLS-XXXX): short description
```

- Same types as commits: `feat`, `fix`, `chore`, `refactor`, `hotfix`
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

Resolves: EQLS-XXXX
```

---

## Self-Review Checklist

Before requesting review:
- [ ] Diff contains only intended changes (no debug logs, commented code, unrelated formatting)
- [ ] Validation commands pass (lint, types, tests)
- [ ] New code follows project conventions (check relevant skill files)
- [ ] No secrets, credentials, or sensitive data in the diff

---

## CLI Usage

Create a PR using the GitHub CLI:

```bash
gh pr create \
  --title "type(EQLS-XXXX): description" \
  --body "$(cat <<'EOF'
## Summary
- ...

## Changes
- ...

## Testing
- [ ] ...

Resolves: EQLS-XXXX
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
4. Include `Resolves: EQLS-XXXX` to auto-link the Linear ticket
