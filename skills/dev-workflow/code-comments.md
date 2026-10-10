# Code Comments

**The default is no comment.** Code says what it does. A comment has to earn its place, and almost none do.

Load this during Implement, and again when re-reading your own diff before commit.

---

## The one test

> If I delete this line, does a future engineer make a **wrong decision**?

If not, delete it. "It might be useful", "it explains the flow", "it's only one line" are all no.

## What earns a comment

Only a decision the code cannot express, where getting it wrong breaks something:

1. **A rule imposed from outside the code.** Pricing, legal, store policy, an API limit, a number someone chose. The code holds the value, not the reason.
2. **A deliberate non-obvious choice where the obvious alternative is wrong.** Why the write happens *after* the transaction; why the failure path returns `[]` instead of falling back.
3. **A constraint that lives in another system.** A vendor API quirk, an App Store review rule, a database planner quirk, an index this query depends on.
4. **A landmine.** A value or ordering another engineer would "tidy up" and silently break.

Write the **why**, never the what. One line, **under 100 characters**; two at the absolute most, never a paragraph. If it needs a second sentence, the name is wrong, not the comment.

```typescript
// Bare `true` only: a quoted value fails closed and silently disables the flag.
const enabled = config.value === true;
```

## Delete on sight

- Narration of the next line (`// fetch the profile` above `getProfile()`)
- Section headers inside a function (`// 1. Validate`, `// --- Helpers ---`)
- Restating a name: fields, args and types that already read clearly
- Storytelling and changelogs: what the code used to do, "we now also handle X"
- Issue numbers in feature code — git blame and the PR carry the link. Allowed only on a non-obvious bugfix
- `TODO` / `FIXME` with no owner and no issue
- JSDoc that adds nothing over the signature
- Commented-out code — git has it
- Test narration that repeats the `describe` / `it` title

## Volume as a signal

A feature PR touching 5–10 files adds roughly **zero to three** comments. More means narrating. **If you feel the need to explain a block, extract and name it instead.**

## Carve-outs

- Conventions a project's own CLAUDE.md or stack skill documents (e.g. screen section markers in `app-dev/architecture.md`)
- Migration SQL explaining a lock, index or timeout choice
- Generated files — never hand-edit their headers

## Reviewing your own diff

`git diff`, read every `//` and `/* */` you added: delete the ones that fail the test, check survivors say *why*, check none will be wrong in a month. `bin/pr-check.sh` does the mechanical half (over 100 chars, more than two lines in a row) and runs on `gh pr create`. File headers, `migrations/` and lint directives are exempt.

In someone else's PR, comment noise is a `nit` — raise it only when a comment is actively misleading.
