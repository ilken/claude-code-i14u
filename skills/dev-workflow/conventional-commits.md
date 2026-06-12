# Conventional Commits

## Format

```
type: description in imperative present-tense lowercase
```

When working from a GitHub issue, include the issue number as scope:

```
type(#123): description in imperative present-tense lowercase
```

## Types

| Type       | When to use                                           |
| ---------- | ----------------------------------------------------- |
| `feat`     | New feature or capability                             |
| `fix`      | Bug fix                                               |
| `chore`    | Maintenance, cleanup, dependency updates              |
| `refactor` | Code restructuring without behavior change            |
| `docs`     | Documentation changes                                 |
| `test`     | Adding or modifying tests                             |
| `revert`   | Reverting a previous change                           |
| `hotfix`   | Urgent production fix                                 |

## Issue Reference

- If working from a GitHub issue, include it as the scope: `(#123)`
- If no issue exists, omit the scope entirely — do not ask the user for one
- Do not duplicate the type in the description

## Language Rules

- Use imperative present-tense: "add", not "added" or "adds"
- Keep the description lowercase
- Be concise and descriptive
- Max 72 characters total

## Examples

```
feat(#42): add dark mode toggle to settings
fix(#78): deduplicate collectable items in forCreator
chore(#12): remove deprecated ItemStaffResolver
refactor(#56): extract auth middleware into separate module
docs(#33): correct spelling of test logs
test(#44): implement unit tests for login
revert(#11): undo changes from commit abc1234
hotfix: fix infinite TTL bug in RedisService
feat: add initial project scaffold
```

## What to Avoid

- Past tense verbs (`added`, `fixed`)
- Capital letters in description
- Vague descriptions (`update stuff`, `changes`)
- Duplicating the type word in the description

## Reference

See: https://www.conventionalcommits.org/en/v1.0.0/
