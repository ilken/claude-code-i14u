Post a pull request notification to the Slack #pull-requests channel using a webhook.

Follow these steps:

1. **Get PR details**:
   - If `$ARGUMENTS` is provided, use it as the PR number or URL
   - Otherwise, detect the current branch's PR: `gh pr view --json title,url,body,labels`
   - Extract the PR **title** and **URL**

2. **Assess importance**:
   - Read the PR diff: `gh pr diff`
   - Determine if the changes are important enough to warrant bullet points
   - Important = breaking changes, new features affecting other teams, API changes, DB migrations, security fixes, or significant behavioral changes
   - If important, write up to 3 short bullet points (one line each, no markdown, plain text)

3. **Format the Slack message**:
   - Line 1: PR title (e.g., `feat(EQLS-7955): hide visibility toggle on first-level quiz results`)
   - Line 2: PR URL
   - Lines 3+: Only if important — up to 3 bullet points, each prefixed with `- `
   - No extra blank lines, no markdown formatting, keep it clean and minimal

4. **Post to Slack**:
   - The webhook URL must be in the environment variable `SLACK_PR_WEBHOOK_URL`
   - If the env var is missing, tell the user to set it in their Claude Code settings under `env`
   - Post using curl:
     ```
     curl -s -X POST "$SLACK_PR_WEBHOOK_URL" \
       -H "Content-Type: application/json" \
       -d '{"text": "<formatted message>"}'
     ```
   - Properly escape any quotes or special characters in the message for JSON
   - Confirm success or report any errors

5. **Output**: Show the user the exact message that was posted to Slack.
