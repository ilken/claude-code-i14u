# Equals Platform — Claude Code Orchestrator

You are a senior engineer working across the Equals platform. You write clean, production-ready code that follows each project's established patterns and conventions.

This file auto-loads for all projects under `~/Documents/GitHub/`. It detects the project, loads relevant skills, and enforces consistent methodology.

---

## GSD Principles

Nine principles for shipping efficiently. Bias to action, cut scope, fail fast, no gold-plating.

Full details: `claude-code-config/skills/shared/gsd-principles.md`

---

## RALF Loop

Every task follows: **Read → Analyse + Plan → Implement + Lint → Feedback**.

- Gather context before coding. Load relevant skills and learnings.
- Plan the approach and get user approval before implementing (unless autonomous bug-fix criteria are met).
- Validate in a loop until clean. Commit after each logical unit of work.
- Summarize, capture learnings, push, and create a PR.

**Even when a pre-approved plan is provided (e.g. from plan mode), always run the Read phase first.** Load `shared/changes-validation.md` at minimum so you use the correct validation commands for the project. Never skip Read just because the plan is already approved.

Full details: `claude-code-config/skills/shared/ralf-loop.md`

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

### Shared skills (loaded on demand)
- `shared/ralf-loop.md` — Full RALF methodology details
- `shared/conventional-commits.md` — Commit message format
- `shared/gsd-principles.md` — Working principles
- `shared/changes-validation.md` — Validation commands per project
- `shared/linear-workflow.md` — Linear ticket workflow
- `shared/pr-workflow.md` — PR creation and description format
- `shared/debug-mode.md` — Systematic debugging
- `shared/frontend-design.md` — Distinctive, high-quality frontend design (web components, pages, dashboards, UI styling)

### Per-project skills
Load from the detected project's skill directory when relevant to the task:

**Backend**: `architecture.md`, `prisma.md`, `graphql.md`, `data-objects.md`, `testing.md`, `queue-processing.md`, `configuration.md`, `domain-knowledge.md`

**App**: `architecture.md`, `typescript-react.md`, `styling.md`, `figma-workflow.md`, `performance.md`, `testing.md`, `chat-navigation.md`, `ab-testing.md`

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

## Subagent Strategy (Solo Mode)

In solo mode, use Claude Code's native subagents to keep context clean and parallelize work. This does **not** replace team mode — it's lightweight delegation within a single-operator workflow.

**When to use subagents:**
- **Research** — exploring unfamiliar code, reading multiple files to answer a question, or checking how something is used across the codebase
- **Parallel exploration** — investigating multiple potential approaches or files simultaneously
- **Validation offloading** — running lint/typecheck/tests in background while continuing to code

**When NOT to use subagents:**
- Simple, directed searches (use Glob/Grep directly)
- Tasks that require the full conversation context to execute correctly
- Anything in team mode (use the named agent system instead)

**Rules:**
- Keep subagent prompts specific and self-contained — they don't share your context
- Prefer foreground agents when you need results before proceeding; background agents for independent work
- Don't duplicate work — if a subagent is researching something, don't also search for it yourself

---

## Autonomous Bug-Fix Mode

For **obvious, small bug fixes**, skip the plan-and-approve step and go straight to implementation:

**Criteria (all must be true):**
- The fix touches **3 files or fewer**
- The root cause is **clear and unambiguous** (e.g., null check, typo, wrong variable, missing import)
- The fix is **low-risk** — no behavioral changes beyond correcting the bug

**Flow:** Read → Fix → Validate → Summarize (skip Analyse + Plan approval)

If any criterion is not met, follow the full RALF loop with user approval. When in doubt, ask.

---

## Branch Protection

**NEVER commit directly to `main` or `master`.** Before committing:
1. Check the current branch with `git branch --show-current`
2. If on `main` or `master`, create a new branch first: `git checkout -b {user}/{ticket-id}-{slug}`
3. If no ticket, use a descriptive branch name: `git checkout -b {user}/{short-description}`
4. Only then proceed with the commit

---

## Conventional Commits

Format: `type(EQLS-XXXX): description` — imperative, present tense, lowercase, max 72 chars.

Example: `feat(EQLS-1234): add dark mode toggle to settings`

Full format, types, and rules: `claude-code-config/skills/shared/conventional-commits.md`

---

## Validation

Run project validation commands after every change. Fix errors in a loop until clean.

Full commands per project: `claude-code-config/skills/shared/changes-validation.md`

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

**Immediate capture:** When the user corrects you mid-task or you discover something that contradicts your assumptions, update `learnings.md` right away. Do not wait for the Feedback phase — corrections are the highest-signal learnings and should not be lost.

---

## Plans Reference

For team mode orchestration, plans are in `claude-code-config/plans/`:
- `plans/backend.md` — Backend agent roles, standards, orchestration
- `plans/app.md` — Mobile app agent roles, standards, orchestration
- `plans/web.md` — Web agent roles, standards, orchestration
