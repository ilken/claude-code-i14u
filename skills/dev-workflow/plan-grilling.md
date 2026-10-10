# Plan Grilling

Stress-test a plan before approval: catch bad assumptions, missing cases and scope issues before code or issues exist.

**Trigger:** the plan touches 3+ files, spans modules, or changes the data model. Skip for obvious single-file fixes.

## How

After writing the plan, before approval:

1. Find the critical decision points — trade-offs, assumptions, ambiguity.
2. Ask **3–5 focused questions**, one at a time, each with your recommended answer.
3. **If the codebase can answer it, explore instead of asking.**
4. Resolve each before the next; walk each branch of the decision tree.
5. Write the outcomes into the plan, with rationale — not only in chat.

Prefix the section with: **"Before we proceed — let me stress-test this plan."** In unattended flows (`/ship`) answer the questions yourself; the simplest defensible answer wins, and every answer goes in the Decision Log.

## What to grill on

- **Already settled**: does an issue, PR, plan file or the project CLAUDE.md already decide this? Cite it and skip.
- **Scope**: right size? split or combine?
- **Approach**: why this over the alternatives; what do we give up?
- **Missing cases**: errors, empty states, permissions, races.
- **Dependencies**: assuming something exists that doesn't? ordering right?
- **Regressions**: blast radius?
- **Acceptance criteria**: testable and unambiguous?

## Sonnet-readiness check

Grilling decides *whether the approach is right*; this decides *whether the plan can be executed without you*. Against the plan output standard in `ralf-loop.md`:

- [ ] Every change names an **exact file path** and a **pattern to mirror**
- [ ] **Out-of-scope** is explicit
- [ ] **Validation commands** and the definition of green are stated
- [ ] **Decisions** are written into the plan with rationale
- [ ] No step says "figure out", "handle appropriately" or "as needed"

Only raise questions that could change the plan; stop when the critical branches are resolved.
