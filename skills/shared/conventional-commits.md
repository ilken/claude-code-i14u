# Conventional Commits

## Format

```
type(EQLS-XXXX): description in imperative present-tense lowercase
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
| `hotfix`   | Urgent production fix (no ticket ID required)         |

## Ticket ID

- Always include the Linear ticket ID in parentheses: `(EQLS-1234)`
- If no ticket ID is available, ask the user for it
- `hotfix` is the only type that does not require a ticket ID

## Language Rules

- Use imperative present-tense: "add", not "added" or "adds"
- Keep the description lowercase
- Be concise and descriptive
- Do not duplicate the type in the description (e.g., avoid `fix(EQLS-1234): fix the bug`)

## Examples

```
feat(EQLS-1234): add dark mode toggle to settings
fix(EQLS-5678): deduplicate collectable items in forCreator
chore(EQLS-9012): remove deprecated ItemStaffResolver
refactor(EQLS-3456): extract auth middleware into separate module
docs(EQLS-3333): correct spelling of test logs
test(EQLS-4444): implement unit tests for login
revert(EQLS-1111): undo changes from commit abc1234
hotfix: fix infinite TTL bug in RedisService
```

## What to Avoid

- Past tense verbs (`added`, `fixed`)
- Capital letters in description
- Missing ticket numbers
- Vague descriptions (`update stuff`, `changes`)
- Duplicating the type word in the description

## Reference

See: https://www.conventionalcommits.org/en/v1.0.0/
