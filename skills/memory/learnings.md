# Learnings and Memory

Append new learnings at the top. Format:

## [DATE] [PROJECT] - [Topic]

## 2026-03-12 Backend - Mutation responses must return enriched objects
When a mutation creates or updates an entity with related data (e.g., conditionGroups), the response must go through the enrichment pipeline (`enrichChatChannels`) instead of returning `fromEntity()` directly. Otherwise nullable relation fields return stale/null data.
---

## 2026-03-12 Backend - Avoid N+1 in enrichment pipelines
When fetching related data for a list of entities in `enrichChatChannels`, always use a single batched query (e.g., `findManyByChannelIds` with `WHERE IN`) instead of mapping over IDs with individual queries. Keep enrichment aligned with the existing batched pattern.
---

## 2026-03-12 Backend - ObjectType constructors must use named props type
GraphQL ObjectType constructors should accept a single named props type (defined locally or in `.types.ts`) instead of positional parameters. This follows the repo convention against inline types and makes field additions safer.
---

## 2026-03-12 Backend - Single findMany with optional filters on models
Models should expose a single `findMany` with optional filter parameters (`chatRoomId?: number; chatRoomIds?: number[]`) instead of multiple specialized finders (`findMany`, `findManyByX`). Grouping/mapping logic belongs in the service layer, not the model.
---

## Maintenance

- Keep this file under ~50 entries / 200 lines
- When it grows beyond that, archive older entries to `skills/memory/archive/learnings-YYYY-MM.md`
- Prune entries that have been codified into dedicated skill files (they're already captured)

---

## 2026-03-12 App - MVVM Pattern for Screens

Non-trivial screens MUST follow MVVM: the screen file focuses on rendering/layout only, and a `use{ScreenName}` hook (in a `hooks/` folder next to the screen) owns all query/mutation/state/callback logic. When adding logic to a screen (e.g., mutations, privacy gating, header config), extract it into the screen hook rather than letting the screen accumulate business logic.

Applies to: `src/screens/**/!(hooks|components)/*.{ts,tsx}`

---

## 2026-03-12 General - Always Run Full Lint Before Creating PR

Always run `yarn code:full-lint` before creating a PR, even when the PR creation is a manual/explicit user request. Never skip validation just because the command came directly from the user. This catches prettier formatting issues that ESLint alone misses.

---

## 2026-03-12 App - Use useCallback for onPress Handlers in Components

Never define onPress handlers inline in JSX (e.g., `onPress={() => doSomething()}`). Extract them into `useCallback` hooks to avoid recreating the function on each render. Apply this pattern for all pressable/touchable handlers in component files.

---

## 2026-03-11 Backend - Use yarn for Prisma commands

Use `yarn prisma generate` (not `npx prisma generate`) for Prisma client generation in the backend project. The project uses yarn throughout.

---

## 2026-03-11 App - Replace Magic Numbers with Named Constants

Avoid magic numbers in component files. Extract numeric literals (sizes, thresholds, offsets, border radii) into named `const` declarations at the top of the file. This improves readability and makes intent clear. Apply this rule proactively when writing or reviewing component code.

---

## 2026-03-11 App - Never Hardcode User-Facing Strings

All user-facing text MUST go through localization (`en.json` + `useLocalization`). This includes section titles, descriptions, labels — not just dynamic content. The rule exists in `skills/app/styling.md` under Localization but is easy to miss. Always check for hardcoded strings before committing.

---

## 2026-03-10 General - Prettier Before PR

Always run `yarn prettier --write` on changed files **before** committing and creating a PR. Add this to the validation step between lint/tsc and commit.

---

## 2026-03-09 Backend - EQLS-7632 Unread Chat Counts

### Architecture Patterns
- `UserApplicationsActivity.mobileAppLastOpenAt` can be queried directly from chat-channel module via `pgPool` raw SQL — same pattern as `ActiveChatChannelAfterTimeWindowQueryModel`. No need to import recommendation-system module.
- `ChatRoomMember` tracks membership for both ARTIST and PRIVATE channel types. For unread count queries, join `ChatMessage` → `ChatRoom` → `ChatRoomMember` with `type` filter.
- `PrismaCustomModel` provides `this.prisma` and `this.pgPool` — use `pgPool.query()` with `$1, $2` parameterized placeholders for raw SQL.
- Models are registered in module via `PrismaUtils.createInjectablePrismaCustomModel`.

### CodeRabbit Review Patterns
- Raw `pgPool.query()` calls should be wrapped in try-catch with `this.handlePgError(error)` — **not** `handlePrismaError`, which is for Prisma ORM errors only. CodeRabbit's suggestion was right about the try-catch, wrong about which handler.
- CodeRabbit correctly flags: all arg types in model method signatures must be named types defined in the module's `.types.ts` file — no inline `Omit<>` or anonymous object types. This includes `FindMany*Args` types for query methods. **Accept this pattern.**
- Test file import paths must use project-root aliases (e.g., `chat-channel/chat-channel.service`) not relative `../` paths.

### Team Mode Learnings
- When spawning agents for rename operations, explicitly tell them NOT to delete files — only modify in place.
- Agents may auto-create PRs and auto-commit. Be explicit about what they should and shouldn't do (e.g., "do NOT create a new PR").
- For sequential rename operations, it's faster to do them directly with Edit tool rather than spawning an agent.

---
