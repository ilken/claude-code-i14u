# Learnings and Memory

Append new learnings at the top. Format:

## [DATE] [PROJECT] - [Topic]
[What was learned]

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
- CodeRabbit correctly flags: constructor params should use named domain types from `.types.ts` instead of inline types. **Accept this pattern.**
- Test file import paths must use project-root aliases (e.g., `chat-channel/chat-channel.service`) not relative `../` paths.

### Team Mode Learnings
- When spawning agents for rename operations, explicitly tell them NOT to delete files — only modify in place.
- Agents may auto-create PRs and auto-commit. Be explicit about what they should and shouldn't do (e.g., "do NOT create a new PR").
- For sequential rename operations, it's faster to do them directly with Edit tool rather than spawning an agent.

---
