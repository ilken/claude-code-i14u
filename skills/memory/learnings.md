# Learnings and Memory

Append new learnings at the top. Format:

## [DATE] [PROJECT] - [Topic]

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
