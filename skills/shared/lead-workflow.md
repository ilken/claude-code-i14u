# Lead Workflow — Detailed Phases

Reference skill for Project Lead Mode (Oak). Loaded lazily when processing a project.

---

## Phase 1 — Read Project

Fetch all project context from GitHub before doing anything else.

### Tools

```bash
# Get repo and project overview
gh repo view --json name,description,defaultBranchRef

# List existing issues (avoid duplicates)
gh issue list --repo <owner>/<repo> --limit 100 --json number,title,labels,state

# Read the PRD issue (usually issue #1 or labelled 'prd')
gh issue view <number> --repo <owner>/<repo>

# List GitHub project items linked to the repo
gh project item-list <project-number> --owner "@me" --format json
```

### What to extract

- Project goal and scope (from PRD issue)
- Existing issues (to avoid duplication)
- PRD acceptance criteria and user stories
- Any linked resources (Figma URLs, API docs, external references)

---

## Phase 2 — Check Figma

Scan the PRD and issue descriptions for Figma URLs. Extract design context for each.

### URL parsing

Extract `fileKey` and `nodeId` from URLs:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId
- `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use branchKey as fileKey

### Tools

```
mcp__claude_ai_Figma__get_design_context   → code hints, screenshot, component info
  - clientFrameworks: "react-native" or "react"
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
- Screenshots for issue descriptions

---

## Phase 3 — Explore Codebase

Understand the current state of the repo before decomposing work.

### What to explore

- Module/folder structure — which modules exist, how they're organized
- Prisma schema — existing models, relations, enums
- GraphQL resolvers and mutations — what's already exposed
- Services and domain logic — existing patterns to follow
- DTOs and input types — naming conventions
- Existing screens, components, hooks — reusable patterns

### Key questions to answer

- Which models, types, queries, mutations need creation or modification?
- Which screens, components, hooks need creation or modification?
- What existing patterns should new code follow?
- Are there shared utilities or abstractions to reuse?

---

## Phase 4 — Analyse & Decompose

Split the project into ordered, right-sized implementation issues.

### Splitting rules

1. **Backend before frontend** — data model → API → UI
2. **Data model first** — Prisma migrations before services
3. **One concern per issue** — don't mix unrelated changes
4. **3-8 files per issue** — right-size for solo pickup
5. **Sequence by dependency** — number issues in execution order

### Ordering pattern

```
1. [BE] Prisma schema + migration
2. [BE] Service layer + business logic
3. [BE] GraphQL resolvers + DTOs
4. [APP/WEB] GraphQL queries/mutations + types
5. [APP/WEB] Shared components (if new)
6. [APP/WEB] Screen/page implementation
7. [APP/WEB] Navigation wiring
8. [BE/APP/WEB] Edge cases, error handling, polish
```

---

## Phase 5 — Present for Approval

Show the full breakdown and **wait for explicit approval** before creating anything.

### Format

```markdown
## Project Decomposition: [Project Name]

| # | Title | Type | Depends On |
|---|-------|------|------------|
| 1 | Add user profile model | BE | — |
| 2 | Profile CRUD service | BE | #1 |
| 3 | Profile GraphQL resolvers | BE | #2 |
| 4 | Profile screen UI | APP | #3 |

### Dependency Graph

1 → 2 → 3 → 4
```

Include for each issue:
- Brief description of what it covers
- Key files to create/modify
- Figma references (if applicable)

**Do not proceed to Phase 6 until the user explicitly approves.**

---

## Phase 6 — Create Issues

Create GitHub issues in dependency order.

### Creation order

1. Create non-dependent issues first → note their numbers
2. Create dependent issues with "Blocked by #N" in the body
3. Add each issue to the GitHub project after creation

### Issue defaults

Every issue must be created with:
- **assignee**: `ilken`
- **label**: `enhancement` (or more specific if applicable)
- **project**: linked GitHub project

### Issue description template

```markdown
## Overview
[1-2 sentence summary of what this issue delivers]

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
- Blocked by: #N [issue title]

## References
- [Links to PRD, Figma, API docs, etc.]
```

### CLI commands

```bash
# Create an issue
gh issue create \
  --title "Title here" \
  --body-file /tmp/issue-body.md \
  --label "enhancement" \
  --assignee "@me" \
  --repo <owner>/<repo>

# Add the issue to the GitHub project
gh project item-add <project-number> \
  --owner "@me" \
  --url <issue-url>
```

### Post-creation summary

After all issues are created, present a summary table:

```markdown
## Created Issues

| # | GitHub Issue | Title | Status |
|---|-------------|-------|--------|
| 1 | #10 | Add user profile model | Created |
| 2 | #11 | Profile CRUD service | Created |

All issues created with blocking relations noted in descriptions.
```
