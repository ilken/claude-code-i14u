Fetch completed Linear issues for all Equals team members since the start of the current month using the Linear MCP tools.

## Steps

1. **Get team members**: Use `mcp__linear__list_users` for the "Equals" team.

2. **Fetch completed issues for each member in parallel**: For each team member, call `mcp__linear__list_issues` with:
   - `assignee`: the member's name
   - `state`: "completed"
   - `updatedAt`: first day of the current month (e.g., "2026-03-01")
   - `limit`: 250

3. **Filter results**: Only count issues where `completedAt` falls within the current month (the query returns issues *updated* since that date, so some may have been completed earlier).

4. **Categorize**: For each member, separate issues into:
   - **Tasks**: issues NOT in the "Bugs" project
   - **Bugs**: issues in the "Bugs" project (projectId: `d5c8d637-2a76-4353-8bd5-9681cdefad43`)

5. **Present a single table** sorted by total completed (descending):

```
## Completed Issues — {Month} 1-{Today}, {Year}

| Member | Total | Tasks | Bugs |
|--------|-------|-------|------|
| ...    | ...   | ...   | ...  |

**Team total: X completed (Y tasks, Z bugs)**
```

Keep the output concise — just the table and total. No breakdown by project or open issues unless asked.
