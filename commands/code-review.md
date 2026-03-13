Review CodeRabbit comments on pull request $ARGUMENTS and address valid feedback.

Follow these steps:

1. **Fetch PR comments**:
   - Get the PR number from the argument (e.g., `123` or a full GitHub URL)
   - If the argument is a URL, extract the PR number from it
   - Detect the repo from the current git remote: `git remote get-url origin`
   - Fetch all review comments: `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments`
   - Also fetch PR review threads: `gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews`
   - Filter to only comments authored by **coderabbitai[bot]** or **coderabbitai**

2. **Read the relevant code**:
   - For each CodeRabbit comment, read the file and line(s) it references
   - Understand the full context around each suggestion

3. **Evaluate each comment**:
   - For each CodeRabbit suggestion, decide: **agree** or **disagree**
   - Present a summary table to the user:
     ```
     | # | File:Line | Suggestion | Verdict | Reason |
     ```
   - Wait for user confirmation before proceeding with changes

4. **Apply agreed changes**:
   - Make the code changes for every suggestion you agreed with
   - If a suggestion is vague, use your best judgment to implement it properly

5. **Reply to PR comments**:
   - For each CodeRabbit comment, reply directly on the PR comment thread
   - Use `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies -f body="..."` to reply in-thread
   - If you **agreed**: reply confirming the fix (e.g., "Fixed." or "Good catch — fixed.")
   - If you **disagreed**: reply explaining why you disagree with the suggestion
   - Keep replies concise and professional

6. **Learn from the review**:
   - For patterns that are reusable (not one-off fixes), append to `~/Documents/GitHub/claude-code-config/skills/memory/learnings.md`
   - Format: `## [DATE] [PROJECT] - CodeRabbit: [Topic]`
   - Focus on patterns that will prevent similar comments in the future

7. **Validate**:
   - Read `~/Documents/GitHub/claude-code-config/skills/shared/changes-validation.md` to get the right commands for the current project
   - Run the project's lint/prettier/typecheck commands
   - Fix any issues in a loop until clean

8. **Commit**:
   - Stage only the changed files
   - Commit with message: `fix(TICKET): address code review feedback`
   - Extract the ticket ID from the branch name if possible
   - Push the changes to the current branch
