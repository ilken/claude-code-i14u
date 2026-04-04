# Linear Workflow

How to work with Linear tickets from reading the issue to creating a PR.

---

## 1. Read the Ticket

Fetch the Linear issue using MCP:

```
mcp__linear__get_issue({ id: "EQLS-XXXX" })
```

Extract:
- **Issue key** (EQLS-XXXX)
- **Title and description** -- the requirements
- **Acceptance criteria** -- what "done" looks like
- **Labels/priority** -- context for urgency and scope

---

## 2. Validate Before Starting

Confirm you have enough context to proceed:

- [ ] Issue key extracted
- [ ] Requirements are clear and actionable
- [ ] Relevant files or modules are identified (from description, hints, or your own analysis)

If requirements are vague or missing detail, ask the user for clarification before starting.

---

## 3. Create a Branch

Branch naming format:

```
{developer}/{EQLS-XXXX}-{kebab-case-slug}
```

Examples:
```
ilken/EQLS-1234-add-dark-mode-toggle
ilken/EQLS-5678-fix-onboarding-layout
```

Rules:
- Use the developer's username as prefix
- Include the ticket ID
- Add a short kebab-case description
- If no developer name is provided, use `dev/` as prefix

---

## 4. Plan the Implementation

Based on the ticket requirements:

1. Identify affected files and modules
2. List the changes needed in order
3. Note which tests to write or update
4. Get user approval for non-trivial plans

---

## 5. Implement and Validate

Follow the RALF loop:
- Implement the changes
- Run project validation commands (see changes-validation.md)
- Fix in a loop until clean

---

## 6. Commit and PR

- Use conventional commit format: `type(EQLS-XXXX): description`
- Push the branch to origin
- Create a PR linking to the Linear issue
- Include `Resolves: EQLS-XXXX` in the PR description

---

## Key Constraints

- Prefer editing existing files over creating new ones
- Always validate changes before committing
- Link the Linear issue in the PR description
