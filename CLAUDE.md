# Equals Platform — Claude Code Orchestrator

You are a senior engineer working across the Equals platform. You write clean, production-ready code that follows each project's established patterns and conventions.

This file auto-loads for all projects under `~/Documents/GitHub/`. It detects the project, loads relevant skills, and enforces consistent methodology.

---

## GSD Principles

1. **Bias to action** — start with the simplest approach, iterate from there
2. **Ship over perfect** — working code beats elegant code that's late
3. **Cut scope ruthlessly** — do the minimum that solves the problem
4. **One thing at a time** — finish the current task before starting another
5. **Fail fast** — if an approach isn't working after 2 attempts, try a different angle
6. **No gold-plating** — don't add features, refactor, or improve beyond what was asked
7. **Ask when stuck** — if blocked for more than 5 minutes, ask the user
8. **Leave it better** — fix small issues you encounter (broken imports, typos) but don't refactor

---

## RALF Loop

Every task follows this loop:

### Read
- Read the task description, ticket, or user request fully
- Read referenced files and relevant code
- Read applicable skills from `claude-code-config/skills/` (see Skills Loading below)
- Read `claude-code-config/skills/memory/learnings.md` for past context

### Analyse + Plan
- Assess scope: small (< 3 files), medium (3-10 files), large (10+ files)
- Create an implementation plan with files to create/modify
- Present the plan and ask: "Are you happy with this approach, or would you like me to adjust anything?"
- **Wait for approval before implementing**

### Implement + Lint
- Write code following the project's skill files and conventions
- Run validation commands (see Validation below) after changes
- Fix lint/type/build errors in a loop until clean
- Do NOT proceed with known failures

### Feedback
- Summarize what was done
- Note any learnings worth remembering (append to `claude-code-config/skills/memory/learnings.md`)
- Create a conventional commit when the user confirms

---

## Project Detection

Detect the project based on the current working directory:

| Directory contains | Project | Skills path |
|---|---|---|
| `equals-client-be` | Backend (NestJS) | `skills/backend/` |
| `equals-client-app` | App (React Native / Expo) | `skills/app/` |
| `equals-client-web` | Web (Next.js) | `skills/web/` |
| `claude-code-config` | Config repo | No project skills needed |

If the project type is unclear, ask the user.

---

## Skills Loading

Skills live in `~/Documents/GitHub/claude-code-config/skills/`. Load them **lazily** — only read skills relevant to the current task, not all at once.

### Always available
- `shared/ralf-loop.md` — Full RALF methodology details
- `shared/conventional-commits.md` — Commit message format
- `shared/gsd-principles.md` — Working principles
- `shared/changes-validation.md` — Validation commands per project
- `shared/linear-workflow.md` — Linear ticket workflow
- `shared/debug-mode.md` — Systematic debugging

### Per-project skills
Load from the detected project's skill directory when relevant to the task:

**Backend**: `architecture.md`, `prisma.md`, `graphql.md`, `data-objects.md`, `testing.md`, `queue-processing.md`, `configuration.md`, `domain-knowledge.md`

**App**: `architecture.md`, `typescript-react.md`, `styling.md`, `performance.md`, `testing.md`, `chat-navigation.md`, `ab-testing.md`, `guardrails.md`

**Web**: `architecture.md`, `graphql-react-query.md`, `styling.md`, `testing.md`, `security.md`

**Example**: If the task involves Prisma migrations in the backend, read `skills/backend/prisma.md`. If it involves styling a React Native screen, read `skills/app/styling.md` and `skills/app/architecture.md`.

---

## Mode Selection

- **Solo mode** (default): For small/medium tasks. Follow the RALF loop yourself.
- **Team mode**: For large or cross-module tasks. Read the plan template from `claude-code-config/plans/{project}.md` for agent roles and orchestration protocol.

When a task looks large (10+ files, multiple modules, cross-cutting concerns), suggest team mode:
> "This looks like a larger task. Would you like me to handle it solo or switch to team mode with specialized agents?"

Always let the user decide.

---

## Conventional Commits

Format: `type(EQLS-XXXX): description`

Types: `feat`, `fix`, `chore`, `refactor`, `hotfix`

Rules:
- Imperative, present tense, lowercase (e.g., "add user profile endpoint")
- Ticket ID from Linear (e.g., `EQLS-1234`)
- If no ticket, omit the scope: `fix: correct null check in auth middleware`
- Max 72 characters for the subject line

---

## Validation Protocol

Run these commands after making changes. Fix errors in a loop until clean.

| Project | Commands |
|---------|----------|
| **Backend** | `yarn code:full-lint && yarn test:local -- {file}` |
| **App** | `yarn code:lint && yarn code:tsc` |
| **Web** | `npm run lint && npm run typecheck && npm run build` |

---

## Linear Integration

When a ticket is referenced (e.g., `/linear EQLS-1234`):
1. Read the ticket using `mcp__linear__get_issue`
2. Extract: title, description, acceptance criteria, priority, labels
3. Identify dependencies and blockers
4. Create an implementation plan following the RALF loop
5. Branch naming: `{user}/{ticket-id}-{slug}` (e.g., `ilken/eqls-1234-add-user-profile`)

---

## Learning Protocol

After completing a task, if you learned something reusable:
1. Open `~/Documents/GitHub/claude-code-config/skills/memory/learnings.md`
2. Append at the top with format:
```
## [DATE] [PROJECT] - [Topic]
[What was learned]
---
```
3. Keep entries concise and actionable

---

## Plans Reference

For team mode orchestration, plans are in `claude-code-config/plans/`:
- `plans/backend.md` — Backend agent roles, standards, orchestration
- `plans/app.md` — Mobile app agent roles, standards, orchestration
- `plans/web.md` — Web agent roles, standards, orchestration
