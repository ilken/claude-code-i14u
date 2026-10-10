# ship-cockpit

A Claude Code mod that `/mod:ship` hands its CI waiting to. It polls the PR's GitHub checks every minute, wakes the session with the verdict, counts pushes against both caps, denies the hard-rule commands, and draws the run in a pane.

## Load it

`setup.sh` merges `CLAUDE_CODE_PLUGIN_DIRS` from `config/claude-settings.json` into `~/.claude/settings.json`, so every new session loads the mod from the main checkout. Without re-running setup, add the line yourself:

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/Developer/claude-code-i14u/mods/ship-cockpit" }
```

For one session only: `claude --plugin-dir ~/Developer/claude-code-i14u/mods/ship-cockpit`.

Typing `/mod:ship` opens the pane; `/cockpit` reopens it. It docks beside the transcript in fullscreen at 110 columns or wider, and sits inline above the prompt when narrower.

## What it does

| Piece | How |
|---|---|
| Tools | `run_start`, `run_update`, `wait`, `status`, `run_end`, listed as `mcp__ship-cockpit__*` behind ToolSearch |
| Poller | Every 60s while a CI wait is armed: `gh pr checks <pr> --json` |
| Wake | Queues a prompt starting `[ship-cockpit] #N:` when CI is green or red, when no check has appeared 5 minutes in (the repo has no CI for this PR), when the deadline passes, or when polling fails 5 times |
| Diagnosis | On red, Haiku reads `gh run view <id> --log-failed` for the head commit's failed runs and adds a short cause list to the wake |
| Guard | In the loop that started a run: denies a push to main, a bare force push, a merge of the run PR, an approve or request-changes review, and a push past either cap of 5. Pushes and merges in `claude-code-i14u` stay free, so learnings still merge mid-run |
| Ledger | Per phase: wall time, model time, tokens, cost and model mix |
| Time split | Working (a model turn running), waiting (a CI wait armed), idle |
| CI | Each CI run with its slowest checks, the failing checks, fix pushes and `gh run rerun`s |
| Health | Cache hit rate, peak context per phase, compactions, both caps, effort, searches |
| Escalation | Once per run, when CI is red after 2 fix pushes or in a third cycle, main-conversation requests go to max effort; the cache hit before and after is recorded |
| History | Each finished run is kept in the mod's store; the pane compares against the median of the same kind |
| Agents | `scout` (Haiku search), `ci-triage` (Sonnet, reads Actions logs), `mechanic` (Haiku, decided edits) |

It reads only. It never comments on an issue, reruns a workflow or touches a PR.

## Check it

```bash
claude plugin validate mods/ship-cockpit
claude plugin test mods/ship-cockpit
```

The mod API is early access. Run both after every Claude Code update.
