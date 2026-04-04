Generate my weekly team meeting report using Linear MCP tools. The report covers Friday to Thursday (current day).

## Steps

1. **Determine the date range**: Find the previous Friday and use today (Thursday) as the end date.

2. **Fetch completed issues**: Call `mcp__linear__list_issues` with:
   - `assignee`: "me"
   - `state`: "completed"
   - `updatedAt`: the previous Friday's date
   - `limit`: 250
   Filter results to only include issues where `completedAt` falls within the Friday–Thursday range.

3. **Fetch in-progress issues**: Call `mcp__linear__list_issues` with:
   - `assignee`: "me"
   - `state`: "started"
   - `limit`: 250

4. **Categorize**:
   - **Bugs**: issues in the "Bugs" project (projectId: `d5c8d637-2a76-4353-8bd5-9681cdefad43`)
   - **Tasks**: everything else (project tasks, micro features, etc.)

5. **Generate the report** in this exact format:

```
**Worked on:**

- {Group related completed tasks by project/theme. Each line is a project or feature with a brief, non-technical description of what was done. Use plain language — this is read to the whole company.}

**Working on:**

- {In-progress tasks that are NOT bugs. Brief description of what's being worked on or in QA.}

**Bugs:**

- {ALL bugs — both fixed and in progress. Append "(fixed)" for completed bugs, "(in QA)" for quality check, "(investigating)" for tech review or in progress.}
```

## Rules

- Use plain, non-technical language — no jargon, no ticket IDs, no code references
- Group related tasks into single lines (e.g. multiple community chatroom tickets become one line)
- Every line must start with "- " for Slack bullet formatting
- Keep descriptions concise — one line per item
- Bugs section combines fixed and in-progress bugs into one list
