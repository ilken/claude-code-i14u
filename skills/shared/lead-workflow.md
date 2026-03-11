# Lead Workflow — Detailed Phases

Reference skill for Project Lead Mode (Oak). Loaded lazily when processing a project.

---

## Phase 1 — Read Project

Fetch all project context from Linear before doing anything else.

### Tools

```
mcp__linear__get_project        → project overview, description, status
mcp__linear__list_milestones    → milestone groupings within the project
mcp__linear__list_issues        → existing tickets (avoid duplicates)
mcp__linear__list_documents     → PRDs, specs, design docs
mcp__linear__get_document       → full content of each document
```

### What to extract

- Project goal and scope
- Milestones and their grouping logic
- Existing tickets (to avoid duplication)
- PRD/spec content with requirements and acceptance criteria
- Any linked resources (Figma URLs, API docs, external references)

---

## Phase 2 — Check Figma

Scan project description and documents for Figma URLs. Extract design context for each.

### URL parsing

Extract `fileKey` and `nodeId` from URLs:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId
- `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use branchKey as fileKey

### Tools

```
mcp__claude_ai_Figma__get_design_context   → code hints, screenshot, component info
  - clientFrameworks: "react-native"
  - clientLanguages: "typescript"
mcp__claude_ai_Figma__get_metadata         → page-level overview of the file
mcp__claude_ai_Figma__get_screenshot       → visual reference for specific nodes
```

### What to record

Per screen/component:
- Layout structure and component hierarchy
- Design tokens (colors, spacing, typography)
- Component names and variants
- Any Code Connect mappings or annotations
- Screenshots for ticket descriptions

---

## Phase 3 — Explore Codebase

Understand the current state of both repos before decomposing work.

### Backend (`equals-client-be`)

Explore:
- `src/` module structure — which modules exist, how they're organized
- Prisma schema — existing models, relations, enums
- GraphQL resolvers and mutations — what's already exposed
- Services and domain logic — existing patterns to follow
- DTOs and input types — naming conventions

### App (`equals-client-app`)

Explore:
- `src/screens/` — existing screens and navigation structure
- `src/components/` — reusable components library
- `src/hooks/` — custom hooks and data fetching patterns
- `src/graphql/` — queries, mutations, fragments
- Navigation config — stack/tab structure
- Existing patterns for similar features

### Key questions to answer

- Which models, types, queries, mutations need creation or modification?
- Which screens, components, hooks need creation or modification?
- What existing patterns should new code follow?
- Are there shared utilities or abstractions to reuse?

---

## Phase 4 — Analyse & Decompose

Split the project into ordered, right-sized implementation tickets.

### Splitting rules

1. **Backend before app** — data model → API → UI
2. **Data model first** — Prisma migrations before services
3. **One concern per ticket** — don't mix unrelated changes
4. **3-8 files per ticket** — right-size for `claude-solo` pickup
5. **Sequence by dependency** — number tickets in execution order

### Ordering pattern

```
1. [BE] Prisma schema + migration
2. [BE] Service layer + business logic
3. [BE] GraphQL resolvers + DTOs
4. [APP] GraphQL queries/mutations + types
5. [APP] Shared components (if new)
6. [APP] Screen implementation
7. [APP] Navigation wiring
8. [BE/APP] Edge cases, error handling, polish
```

### Label assignment

Look up label IDs via `mcp__linear__list_issue_labels` for:
- `equals-client-be` — backend tickets
- `equals-client-app` — app tickets

### Milestone assignment

If the project has milestones, assign each ticket to the appropriate milestone based on the decomposition.

---

## Phase 5 — Present for Approval

Show the full breakdown and **wait for explicit approval** before creating anything.

### Format

```markdown
## Project Decomposition: [Project Name]

| # | Title | Type | Labels | Depends On | Milestone |
|---|-------|------|--------|------------|-----------|
| 1 | Add user profile model | BE | equals-client-be | — | MVP |
| 2 | Profile CRUD service | BE | equals-client-be | #1 | MVP |
| 3 | Profile GraphQL resolvers | BE | equals-client-be | #2 | MVP |
| 4 | Profile screen UI | APP | equals-client-app | #3 | MVP |

### Dependency Graph

1 → 2 → 3 → 4
```

Include for each ticket:
- Brief description of what it covers
- Key files to create/modify
- Figma references (if applicable)

**Do not proceed to Phase 6 until the user explicitly approves.**

---

## Phase 6 — Create Tickets

Create tickets in dependency order on Linear.

### Creation order

1. Create non-dependent tickets first → capture their IDs
2. Create dependent tickets with `blockedBy` relations using captured IDs
3. Assign all metadata: team, project, milestone, labels, priority, state

### Ticket defaults

Every ticket must be created with:
- **state**: `Todo`
- **assignee**: `ilken`
- **labels**: `FRAME-XYZ/equals-client-be` (backend) or `FRAME-XYZ/equals-client-app` (app)

### Ticket description template

Each ticket description should follow this structure:

```markdown
## Overview
[1-2 sentence summary of what this ticket delivers]

## Technical Approach

### Files to create/modify
- `path/to/file.ts` — [what changes]
- `path/to/other.ts` — [what changes]

### Implementation steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Design Specs
[Figma screenshots/specs if applicable, otherwise omit this section]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Dependencies
- Blocked by: [EQLS-XXXX] [ticket title]

## References
- [Links to PRD, Figma, API docs, etc.]
```

### Tool usage

```
mcp__linear__save_issue
  - title: "ticket title"
  - description: [template above]
  - team: "Equals"
  - project: [project name]
  - milestone: [if applicable]
  - labels: ["FRAME-XYZ/equals-client-be"] or ["FRAME-XYZ/equals-client-app"]
  - priority: [1-4, matching project priority]
  - state: "Todo"
  - assignee: "ilken"
  - blockedBy: [identifiers of tickets this depends on, e.g. "EQLS-1001"]
```

### Post-creation summary

After all tickets are created, present a summary table:

```markdown
## Created Tickets

| # | ID | Title | Status |
|---|-----|-------|--------|
| 1 | EQLS-1001 | Add user profile model | Created |
| 2 | EQLS-1002 | Profile CRUD service | Created |

All tickets created with blocking relations set.
```
