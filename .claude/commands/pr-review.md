Review pull request $ARGUMENTS — run a proactive scan, then address CodeRabbit comments.

Follow these steps:

## Phase 1: Proactive Scan

Before looking at CodeRabbit comments, perform your own analysis of the PR changes.

1. **Fetch the diff**:
   - Detect the repo from `git remote get-url origin`
   - Get the PR diff: `gh pr diff {pr_number}`
   - Identify all changed files and the scope of changes

2. **Blast radius analysis**:
   - For each changed file, trace its imports/consumers: who depends on this file?
   - Flag changes to shared utilities, exported types, or public service methods — these have high blast radius
   - Check if changed function signatures match all call sites
   - Present findings as:
     ```
     | Changed File | Consumers | Risk | Note |
     ```

3. **Security pattern scan**:
   - Grep changed files for security anti-patterns:
     - Raw SQL or string-interpolated queries
     - Hardcoded secrets, API keys, tokens (patterns: `sk-`, `Bearer `, connection strings, `password =`)
     - `eval()`, `new Function()`, `dangerouslySetInnerHTML`
     - Missing auth/permission checks on new endpoints or resolvers
     - Sensitive data in log statements (passwords, tokens, PII)
   - Only flag findings in **changed lines** (not pre-existing issues)

4. **Breaking change detection**:
   - Check for changes to: GraphQL schema types/fields, REST API signatures, Prisma schema (column renames, drops, type changes), exported function signatures, config keys/env vars
   - Flag any change that could break existing consumers or require a migration

5. **Test coverage delta**:
   - Count new/changed source lines vs new/changed test lines
   - Flag if significant new logic was added with no corresponding tests
   - This is a heuristic, not a hard rule — use judgment

6. **Present proactive findings**:
   - Show a summary table of all findings grouped by category
   - For each finding, include: file, line(s), category, severity (high/medium/low), description
   - Wait for user acknowledgment before proceeding to Phase 2

---

## Phase 2: CodeRabbit Comment Review

7. **Fetch PR comments**:
   - Get the PR number from the argument (e.g., `123` or a full GitHub URL)
   - If the argument is a URL, extract the PR number from it
   - Fetch all review comments: `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments`
   - Also fetch PR review threads: `gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews`
   - Filter to only comments authored by **coderabbitai[bot]** or **coderabbitai**

8. **Read the relevant code**:
   - For each CodeRabbit comment, read the file and line(s) it references
   - Understand the full context around each suggestion

9. **Evaluate each comment**:
   - For each CodeRabbit suggestion, decide: **agree** or **disagree**
   - Cross-reference with your Phase 1 findings — did you catch the same issue?
   - Present a summary table to the user:
     ```
     | # | File:Line | Suggestion | Verdict | Reason |
     ```
   - Wait for user confirmation before proceeding with changes

10. **Apply agreed changes**:
    - Make the code changes for every suggestion you agreed with
    - Also fix any Phase 1 findings the user agreed with
    - If a suggestion is vague, use your best judgment to implement it properly

11. **Reply to PR comments**:
    - For each CodeRabbit comment, reply directly on the PR comment thread
    - Use `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies -f body="..."` to reply in-thread
    - If you **agreed**: reply confirming the fix (e.g., "Fixed. 🤖" or "Good catch — fixed. 🤖")
    - If you **disagreed**: reply explaining why you disagree with the suggestion, ending with 🤖
    - Keep replies concise and professional. Always end the comment with 🤖

12. **Learn from the review**:
    - For patterns that are reusable (not one-off fixes), append to `~/Documents/GitHub/claude-code-config/skills/memory/learnings.md`
    - Format: `## [DATE] [PROJECT] - CodeRabbit: [Topic]`
    - Focus on patterns that will prevent similar comments in the future

13. **Validate**:
    - Read `~/Developer/claude-code-i14u/skills/dev-workflow/changes-validation.md` to get the right commands for the current project
    - Run the project's lint/prettier/typecheck commands
    - Fix any issues in a loop until clean

14. **Commit**:
    - Stage only the changed files
    - Commit with message: `fix(TICKET): address code review feedback`
    - Extract the ticket ID from the branch name if possible
    - Push the changes to the current branch
