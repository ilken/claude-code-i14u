---
name: project:brainstorm-to-prd
description: Use this skill to write a PRD (Product Requirements Document) for a new feature or initiative. Triggers when the user says "write a PRD", "create a PRD", "product requirements", "spec this out", "write a spec", or when they want to formalise a plan into a structured document before building. Conducts a user interview, explores the codebase, designs the modules, and submits the PRD as a GitHub issue. Use this any time a feature needs to be properly speced before implementation begins.
---

# Write a PRD

Turn a rough idea into a structured product requirements document, submitted as a GitHub issue.

## The five steps

Work through these in order. Each step produces input for the next — don't skip ahead.

1. **Problem definition** — understand what the user is trying to solve
2. **Codebase analysis** — validate assumptions against the current state of the code
3. **User interview** — resolve every open design decision before writing
4. **Module design** — sketch the major components and their interfaces
5. **PRD documentation** — synthesise everything into a GitHub issue

---

## Step 1: Problem definition

Ask the user to describe:
- What problem does this solve? (from the user's perspective, not the engineer's)
- What's their rough idea for the solution?
- Who is affected, and how do they experience the problem today?

Don't move on until you can restate the problem in one sentence and the user confirms it.

---

## Step 2: Codebase analysis

Before interviewing, explore the repo to understand what already exists. This prevents you from asking questions that the codebase can answer, and lets you surface constraints the user may not know about.

Look for:
- Existing code that touches the problem area (data models, services, API routes, UI components)
- Patterns and conventions that the implementation will need to follow
- Prior art — has something similar been attempted before?
- Hard constraints (schema shape, API contracts, auth boundaries) that constrain design choices

Share what you find: "I looked at X and found Y — that means we probably need to Z. Does that match your expectation?"

---

## Step 3: User interview

Conduct a thorough interview to resolve every significant design decision before writing a single line of the PRD. Follow the same dependency-ordered approach as `/project:brainstorm` — foundational decisions first, branches after.

For each open decision:
- State the question clearly
- Give your recommended answer with reasoning (drawing on what you found in the codebase)
- Ask for confirmation, pushback, or refinement

Cover these areas (adapt to what's relevant):
- **Scope** — what's in, what's explicitly out
- **User stories** — who does what, and why does it matter to them
- **Data model** — new entities, changed fields, migrations required
- **API / interface contracts** — what does each module expose and consume
- **Edge cases** — what happens when things go wrong, or inputs are unexpected
- **Testing** — what does "done" look like, what needs test coverage
- **Rollout** — flags, migrations, backwards compatibility concerns

Keep going until all significant unknowns are resolved.

---

## Step 4: Module design

Sketch the major components that will implement this feature. Think in terms of **deep modules** — components that hide complexity behind a stable, minimal interface. A deep module does a lot, exposes little, and is easy to test in isolation.

For each module, define:
- **Name and responsibility** — what it owns and nothing else
- **Interface** — the public API (function signatures, REST endpoints, event types, etc.)
- **Dependencies** — what it calls or receives from
- **Schema changes** — if it owns data, what changes to the data model

Present this as a lightweight design sketch, not a full spec. The goal is to catch interface mismatches before implementation, not to over-engineer upfront.

---

## Step 5: PRD documentation

Synthesise everything into a GitHub issue using the template below. Submit with:

```bash
gh issue create \
  --title "<Feature name>" \
  --body-file /tmp/prd-body.md \
  --label "prd" \
  --assignee "@me"
```

Create the `prd` label if it doesn't exist:
```bash
gh label create "prd" --color "0075ca" --description "Product requirements document"
```

---

## PRD template

Use this exact structure. Keep each section tight — a PRD is a decision record, not an essay.

```markdown
## Problem statement

> What problem does this solve, from the user's perspective?

[One to three sentences. No jargon. Written as if explaining to someone who doesn't know the codebase.]

## Solution

> How does this feature resolve the problem, from the user's perspective?

[One to three sentences. Focus on outcome, not implementation.]

## User stories

1. As a [actor], I want [capability], so that [benefit].
2. As a [actor], I want [capability], so that [benefit].
...

[Be exhaustive. Include primary flows and edge cases. Number them — they'll be referenced in testing decisions.]

## Implementation decisions

### Modules

| Module | Responsibility | Interface |
|--------|---------------|-----------|
| `ModuleName` | What it owns | Key methods / endpoints |

### Schema changes

[List any new tables, new columns, changed columns, or migrations required. If none, say "No schema changes."]

### API contracts

[Key request/response shapes, event payloads, or function signatures for any new interfaces.]

### Technical decisions

[Choices made during the interview that affect implementation — libraries chosen, patterns followed, constraints observed. One bullet per decision with brief rationale.]

## Testing decisions

- [ ] [User story #N] — [What to verify and how]
- [ ] [Edge case] — [What to verify and how]

[Reference user stories by number. Cover both happy path and failure modes.]

## Out of scope

- [Explicitly excluded feature or concern]
- [Another exclusion]

[If something came up in the interview and was deliberately excluded, record it here so it doesn't get re-raised.]

## Further notes

[Anything that doesn't fit above — links to prior discussions, open questions deferred to implementation, related issues.]
```

---

## After submitting

Print the issue URL and suggest next steps:
- `/project:prd-to-git-project` — if this PRD should become a GitHub project with issues
- `/project:brainstorm` — if there are still unresolved design branches worth exploring
