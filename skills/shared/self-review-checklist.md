# Self-Review Checklist

Run this checklist mentally **after lint passes but before committing**. The goal is to catch issues that automated linting misses but code reviewers (human or CodeRabbit) consistently flag.

Load this skill alongside `changes-validation.md` during the Lint phase.

---

## Types & Signatures

- [ ] **No inline types in method signatures.** Every argument type and return type must be a named type in the module's `.types.ts` file. This includes:
  - Function parameters (use a named args object, not positional primitives)
  - Return types (e.g., `ParsedMention[]` not `{ profileId: number; handle: string }[]`)
  - Union literals (e.g., `MentionParentType` not `'post' | 'reply'`)
- [ ] **No local type aliases inside method bodies.** Extract them to `.types.ts`.
- [ ] **Private methods with 3+ params use a named args object.** Positional params are fine for 1-2 args, but 3+ should be a single typed object for readability and extensibility.

## Error Handling

- [ ] **Non-critical side effects are wrapped in try-catch.** If an operation (mentions, analytics, notifications) is secondary to the main flow (post creation, reply creation), wrap it so failures don't break the primary operation. Log the error, don't rethrow.
- [ ] **Authorization/evaluation logic fails closed.** Default/unknown cases deny access (`satisfied = false`), never silently pass.

## Database & Queries

- [ ] **No redundant symmetric queries.** If a relationship is symmetric by status (e.g., `MUTUAL` friendship), one directional query is sufficient. Don't query both directions.
- [ ] **Guard `findMany` against empty filters.** If a method accepts multiple optional filters, ensure at least one is provided to avoid full-table scans.
- [ ] **No N+1 patterns in enrichment.** Use batched `WHERE IN` queries, not `.map()` with individual lookups.
- [ ] **Mutation responses go through enrichment.** Don't return `fromEntity()` directly when the response has relation fields.

## Module Boundaries

- [ ] **Access other modules through their public service.** Never import sub-modules directly (e.g., use `ProfileService`, not `ProfileFriendService`).
- [ ] **Models are not exposed outside their module.** Only services are exported.
- [ ] **New tables have both `createdAt` and `updatedAt`.** No exceptions.

## Tests

- [ ] **Test with different actors.** Don't only test with the resource owner — include at least one test where the requester is a different user.
- [ ] **Include regression tests.** When adding behavior to existing flows (e.g., mentions in post creation), add a test that verifies the flow still works without the new feature (plain post without mentions).

---

## When to Use

- **Always** before the first commit of new code
- **After review feedback** to verify you didn't introduce the same class of issue elsewhere
- **Skip** for pure refactors with no new types, error handling, or DB queries

## Evolving This Checklist

When a code review flags a pattern that isn't covered here and is likely to recur:
1. Add it to the appropriate section above
2. Also add a learning to `memory/learnings.md` with the specific context
