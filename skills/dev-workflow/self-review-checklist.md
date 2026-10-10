# Self-Review Checklist

Run this checklist mentally **after lint passes but before committing**. The goal is to catch issues that automated linting misses but code reviewers (human or the Opus reviewer) consistently flag.

Load this skill alongside `changes-validation.md` during the Lint phase.

---

## Types & Signatures

- [ ] **No inline types in method signatures.** Every argument type and return type must be a named type in the module's `.types.ts` file. This includes:
  - Function parameters (use a named args object, not positional primitives)
  - Return types (e.g., `ParsedMention[]` not `{ profileId: number; handle: string }[]`)
  - Union literals (e.g., `MentionParentType` not `'post' | 'reply'`)
- [ ] **No local type aliases inside method bodies.** Extract them to `.types.ts`.
- [ ] **Private methods with 3+ params use a named args object.** Positional params are fine for 1-2 args, but 3+ should be a single typed object for readability and extensibility.

## Comments

Full rule: `code-comments.md`. The default is **no comment**.

- [ ] **`bin/pr-check.sh` is clean** — no comment line over 100 characters, no block over two lines. It also runs on `gh pr create`.
- [ ] **Every added comment survives the one test** (deleting it would let someone make a wrong decision) and says *why*, not *what*. Narration, in-function section headers, changelog prose, commented-out code and empty JSDoc are deleted.
- [ ] **Zero to three added comments** for a 5–10 file feature PR. More: rename, early-return or extract instead.
- [ ] **No issue numbers in feature-code comments**, except on a non-obvious bugfix.

## Error Handling

- [ ] **Non-critical side effects are wrapped in try-catch.** If an operation (mentions, analytics, notifications) is secondary to the main flow (post creation, reply creation), wrap it so failures don't break the primary operation. Log the error, don't rethrow.
- [ ] **Authorization/evaluation logic fails closed.** Default/unknown cases deny access (`satisfied = false`), never silently pass.
- [ ] **No guard for a state that cannot happen.** If a type, DB constraint, validated input or the platform already rules it out, delete the guard. Keep validation at trust boundaries (API input, queue payloads, webhooks, JSON columns, vendor responses), and keep authorization checks even when unreachable today.

## Database & Queries

- [ ] **No redundant symmetric queries.** If a relationship is symmetric by status (e.g., `MUTUAL` friendship), one directional query is sufficient. Don't query both directions.
- [ ] **Guard `findMany` against empty filters.** If a method accepts multiple optional filters, ensure at least one is provided to avoid full-table scans.
- [ ] **No N+1 patterns in enrichment.** Use batched `WHERE IN` queries, not `.map()` with individual lookups.
- [ ] **Mutation responses go through enrichment.** Don't return `fromEntity()` directly when the response has relation fields.

## Module Boundaries

- [ ] **Access other modules through their public service.** Never import sub-modules directly (e.g., use `ProfileService`, not `ProfileFriendService`).
- [ ] **Models are not exposed outside their module.** Only services are exported.
- [ ] **New tables have both `createdAt` and `updatedAt`.** No exceptions.

## Security

- [ ] **No raw SQL or unsanitized query params.** Use Prisma's query builder or parameterized queries. Never interpolate user input into query strings.
- [ ] **No hardcoded secrets, API keys, or tokens.** Credentials belong in environment variables, not source code. Check for anything that looks like `sk-`, `Bearer `, API keys, or connection strings.
- [ ] **No dangerous dynamic execution.** Avoid `eval()`, `new Function()`, `dangerouslySetInnerHTML`, or template literals passed to query engines. If unavoidable, sanitize inputs rigorously.
- [ ] **New endpoints have auth/permission checks.** Every new resolver, controller, or route must enforce authentication and authorization. No public-by-default.
- [ ] **No sensitive data in logs.** Don't log passwords, tokens, PII, or full request bodies that may contain user data. Log IDs and metadata instead.

## Frontend

- [ ] **Feedback the user must act on while a native `<dialog>` is modal lives inside the dialog.** `showModal()` makes the rest of the page inert, a global toaster included.

## Tests

- [ ] **Test with different actors.** Don't only test with the resource owner — include at least one test where the requester is a different user.
- [ ] **Include regression tests.** When adding behavior to existing flows (e.g., mentions in post creation), add a test that verifies the flow still works without the new feature (plain post without mentions).

## Edits

- [ ] **Every scripted edit landed.** A `sed` or `str.replace` that misses its anchor is a silent no-op, and a green typecheck can't prove an insert happened. Guard each one (`assert old in s`) or check `git diff --stat`; otherwise use the Edit tool.

---

## When to Use

- **Always** before the first commit of new code
- **After review feedback** — when a reviewer flags one instance, audit **every** file and signature you touched in one pass and fix them all
- **Skip** for pure refactors with no new types, error handling, or DB queries

## Evolving This Checklist

When a code review flags a pattern that isn't covered here and is likely to recur:
1. Add it to the appropriate section above
2. Also add a learning to `memory/learnings.md` with the specific context
