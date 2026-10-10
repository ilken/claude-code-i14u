---
name: project:prd-to-git-project
description: Use this skill to turn a brainstormed idea, PRD, or plan into a GitHub project with phased issues. Triggers when the user says "create a project", "turn this into a GitHub project", "create issues for this", "set up the project", "plan this out", or after a brainstorm or PRD session and the user wants to move to execution. Explores the codebase, breaks the work into vertical slices (tracer bullets), writes a plan file, creates a GitHub Projects board, and creates linked issues per phase. Use this any time a feature needs to go from idea or PRD to structured GitHub work.
---

# PRD to Git Project

Turn an idea or PRD into a phased GitHub project with linked issues, ready to execute.

## What you're building

- A `./plans/<feature>.md` file with architectural decisions and phased vertical slices
- A GitHub Projects board linked to the current repo
- One issue per phase, each linked to the project

## The inputs

This skill works from whatever is in context:
- A raw idea or brainstorm → you'll interview and explore before planning
- A PRD (pasted or linked as a GitHub issue) → go straight to slicing
- A partial plan → pick up where it left off

If nothing is in context, ask: "What are we building? Paste the plan or PRD, or describe the idea and I'll help break it down."

---

## Step 1: Understand the goal

Restate the feature in one sentence and confirm with the user before proceeding.

---

## Step 2: Explore the codebase

Before planning, orient yourself to the current code. Look for:
- Existing code that touches the problem area (models, services, routes, components)
- Patterns and conventions the implementation must follow
- Hard constraints (schema shape, auth boundaries, API contracts)
- Prior art — anything similar already attempted

Share what you find and flag anything that changes the design. This prevents creating a plan that contradicts the codebase.

---

## Step 3: Identify durable architectural decisions

Before breaking into phases, pin down the high-level decisions that are stable across all phases — these belong in the plan header so every phase can reference them:

- Route structures / URL patterns
- Database schema shape and key models
- Authentication / authorisation approach
- Third-party service boundaries
- Key interfaces between major modules

If any of these are unresolved, ask now (one question at a time, with your recommendation). Don't proceed until they're settled.

---

## Step 4: Break into vertical slices

Break the work into **tracer bullet** phases. Each phase is a thin vertical slice that cuts end-to-end through all integration layers — not a horizontal slice of one layer.

**Rules for vertical slices:**
- Each slice delivers a narrow but complete path through every layer (schema → API → UI → tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over a few thick ones
- Avoid naming specific files or function names — those will change as later phases are built
- Do include durable decisions: route paths, schema shapes, model names, interface contracts

Present the proposed phases to the user:

```
Here's how I'd slice this:

**Phase 1: [Title]**
User stories covered: [#1, #3]
What it delivers: [one sentence end-to-end description]

**Phase 2: [Title]**
User stories covered: [#2, #4]
What it delivers: [one sentence end-to-end description]

Does the granularity feel right? Too coarse, too fine, anything to merge or split?
```

Iterate until the user approves the breakdown.

---

## Step 5: Write the plan file

Create `./plans/` if it doesn't exist. Write a Markdown plan file named after the feature (e.g. `./plans/user-onboarding.md`):

```markdown
# Plan: <Feature Name>

> Source: <brief description or link to PRD issue>

## Architectural decisions

- **Routes**: ...
- **Schema**: ...
- **Key models**: ...
- **Auth approach**: ...
- (add/remove as appropriate)

## Phase 1: <Title>

**User stories**: <list>

### What to build

A concise end-to-end description of this slice. Describe behavior, not layer-by-layer implementation.

### Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

---

## Phase 2: <Title>

...
```

---

## Step 6: Check the repo context

```bash
# Confirm the repo
gh repo view --json nameWithOwner,defaultBranchRef -q '.nameWithOwner + " (default branch: " + .defaultBranchRef.name + ")"'

# Check existing labels (reuse where sensible)
gh label list

# Check existing projects (avoid duplicates)
gh project list --owner "@me" --limit 20
```

If a project with the same or very similar name already exists, ask the user before creating a new one.

---

## Step 7: Create the GitHub project

```bash
# Create the project
gh project create --owner "@me" --title "<Project Title>" --format json

# Link it to the current repo
gh project link <project-number>
```

---

## Step 8: Create one issue per phase

Create issues in phase order. Each issue maps to one vertical slice:

```bash
gh issue create \
  --title "Phase <N>: <Title>" \
  --body-file /tmp/phase-<n>-body.md \
  --label "<label>" \
  --project "<project title>"
```

**Issue body template:**

```markdown
## What
<one sentence: what this phase delivers end-to-end>

## User stories
- [story from PRD or plan]

## Acceptance criteria
- [ ] <specific, checkable criterion>
- [ ] <another criterion>

## Notes
<any durable architectural decisions relevant to this phase>
```

**Labels**: Reuse existing labels. Create new ones only if they'll apply to multiple issues. Create with:

```bash
gh label create "<name>" --color "<hex>" --description "<short description>"
```

**Ordering**: Create foundational phases first. Note blocking relationships where relevant ("Blocked by #X").

---

## Step 9: Confirm and share

Print a summary:

```
✓ Plan written: ./plans/<feature>.md
✓ Created project: <title> (#<number>)
✓ Created <N> issues:

  #1  Phase 1: <title>
  #2  Phase 2: <title>
  ...

Project board: <url>
```

Get the project URL with:
```bash
gh project view <number> --format json -q '.url'
```
