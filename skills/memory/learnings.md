# Learnings and Memory

Append new learnings at the top. Format:

## [DATE] [PROJECT] - [Topic]

## 2026-03-13 Backend - Fail closed in authorization/evaluation logic
When writing code that evaluates conditions for access control (e.g., channel join conditions, permission checks), always handle the default/unexpected case by denying access (`satisfied = false`). Use explicit `switch` with `default: satisfied = false` rather than `if/else` chains that silently skip unknown values. Failing open in auth logic means malformed data can grant unintended access.
---

## 2026-03-13 Backend - Submodule folder structure must mirror parent conventions
When creating a submodule (e.g., `chat-channel-conditions/` under `chat-channel/`), follow the same folder structure as the parent module: entities go in `entities/`, models go in `models/`, DTOs in the root or a `dto/` folder. Never put entity or model files directly in the submodule root. The architecture skill documents this pattern — always check `skills/backend/architecture.md` before creating new modules.
---

## 2026-03-13 Backend - Service access patterns: use public API modules
Don't import internal sub-modules (e.g., `ProfileFollowModule`, `CollectedModule`) into other domain modules. Access their services through the parent module's public service (e.g., `ProfileService.isFollowingMany()`, `CollectableService.findAllCollectedCollectableItemIds()`). If a passthrough method doesn't exist, add one to the parent service.
---

## 2026-03-13 Backend - DTOs for service return types, types for args
Service methods should return class-based DTOs (in `.dto.ts` files), not plain type aliases. Constructor args stay in `.types.ts` files. DTOs use a props-object constructor pattern with `public readonly` fields. See `chatroom-join-condition-evaluation.dto.ts` as reference.
---

## 2026-03-13 Backend - Rebase strategy for stacked PRs
When a feature branch contains commits from a previously merged PR, don't rebase (causes conflicts). Instead: create a temp branch from `origin/main`, cherry-pick only the new commits, force-push to the PR branch, then delete the temp branch.
---

## 2026-03-13 Backend - Always run yarn code:full-lint before committing
`yarn code:tsc` only checks types. `yarn code:full-lint` runs prettier + eslint + tsc. Import ordering issues and formatting are only caught by the full lint. Always use full lint as the final validation step.
---

## 2026-03-13 Backend - Test with different requesting users
When testing per-user evaluation (e.g., conditions, permissions), always include at least one test where the requester is NOT the channel owner/creator. Otherwise a bug that evaluates against the owner instead of the authenticated caller would pass the entire suite.
---

## 2026-03-13 Backend - Normalise invalid data at the mapping boundary
When mapping ordered array inputs (e.g., condition groups), enforce invariants at the mapper — e.g., the first element's `combinator` must be null because it has nothing to combine with. Don't trust client input for positional semantics.
---

## 2026-03-12 Backend - ObjectType constructors must use named props type
GraphQL ObjectType constructors should accept a single named props type (defined locally or in `.types.ts`) instead of positional parameters. This follows the repo convention against inline types and makes field additions safer.
---

## 2026-03-11 Backend - Use yarn for Prisma commands
Use `yarn prisma generate` (not `npx prisma generate`) for Prisma client generation in the backend project. The project uses yarn throughout.
---

## 2026-03-09 Backend - EQLS-7632 Team Mode Learnings
- When spawning agents for rename operations, explicitly tell them NOT to delete files — only modify in place.
- Agents may auto-create PRs and auto-commit. Be explicit about what they should and shouldn't do (e.g., "do NOT create a new PR").
- For sequential rename operations, it's faster to do them directly with Edit tool rather than spawning an agent.
---

## Maintenance

- Keep this file under ~50 entries / 200 lines
- When it grows beyond that, archive older entries to `skills/memory/archive/learnings-YYYY-MM.md`
- Prune entries that have been codified into dedicated skill files (they're already captured)

---
