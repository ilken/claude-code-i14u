Retro on a finished session, usually `/ship` or a fix run: what in the **environment** (skills, commands, hooks, checks, permissions, tools) would have made it faster or right first time. Read-only until the user picks fixes.

1. **Digest:** `python3 ~/Developer/claude-code-i14u/bin/session-digest.py $ARGUMENTS`. Takes a session id (a prefix works), `#N` / an issue number (newest session whose opening names it), or nothing (this session). Never Read a raw transcript — they reach many MB. `--timeline` adds narration and every call; `--record <timestamp>` prints one call in full.
2. **Outcome:** the PR it produced (`gh pr view <pr> --comments`, review rounds, CI fix pushes) shows what review caught that implementation missed. If the digest says the session is still running, say so and skip this step.
3. **Candidates**, each tied to digest evidence (timestamp and call):

| Signal | Fix lands in |
|---|---|
| User correction or mid-turn redirect | `learnings.md` or auto-memory; a repeat means the skill that should prevent it is wrong |
| Long search before the right file | the project's CLAUDE.md, or the CLAUDE.md quick-start map |
| Mistake a deterministic check could catch | the repo's own lint/test first, else a hook in `config/claude-settings.json` or a `bin/*` check |
| Judgement mistake caught late by review or CI | `self-review-checklist.md` or `code-review.md` |
| Large, failed or repeated tool calls | the skill step that caused them, or a `bin/` script |
| Instruction that changed nothing or contradicts another | delete or merge it |
| Information the agent lacked | MCP, permission allowlist, a runbook |

4. **Rank:** **High** caused a wrong or reworked result, or recurs every run. **Medium** is a recurring time/token cost. **Low** is one-off friction. Drop anything without evidence.

Output `## Retro: <title> (<session id>, <duration>, <turns> turns)` then `| # | Importance | Finding (evidence) | Fix (file) | Effort |`, most important first. Ask which numbers to apply: config changes follow the auto-merge rule, project changes get their own branch.
