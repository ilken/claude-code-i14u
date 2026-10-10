Ship $ARGUMENTS with `~/.claude/commands/ship.md`, every phase and rule of it, but hand the CI waiting, the counting and the hard rules to the `ship-cockpit` mod.

1. **Preflight.** Load `select:mcp__ship-cockpit__run_start,mcp__ship-cockpit__run_update,mcp__ship-cockpit__wait,mcp__ship-cockpit__status,mcp__ship-cockpit__run_end` with ToolSearch. Missing → the mod isn't loaded: say so in one line, point at `~/Developer/claude-code-i14u/mods/ship-cockpit/README.md`, and run `/ship` unchanged.
2. **Phase 1.** Once the issue is resolved, call `run_start({ issue: "#<n>", title, repo: "<owner>/<name>", kind })` with `kind` one of `backend`, `app`, `web`, `other`. On a resumed run, trust the counters it returns over your own.
3. **Every phase.** Report it with `run_update({ issue, phase })` as you enter it, and always before a push — pushes count against a cap by the phase the cockpit holds:

   | `/ship` step | Phase |
   |---|---|
   | 6 | `implement` |
   | 7 | `design-check` |
   | 8 | `review` |
   | 9 | `pr`, then `run_update` with `pr: <number>` |
   | 12, before the fix push | `ci-fix` (cap 5) |
   | 12, re-review fixes | `review-fix` (counts as a cycle) |
   | 14, rebase push | `loop` (counts as a cycle) |

4. **Phase 4.** Don't start `gh pr checks --watch`. Call `wait({ issue, kind: "ci" })`, start a watchdog (`sleep 1800` as a background Bash task), end your turn, and act on the `[ship-cockpit]` wake. Stop the watchdog after any wake.
   - Watchdog fires first → `status`: wait armed and `heartbeatAgeSec` < 180 → new watchdog, end turn; no wait armed → act on the wake you have; heartbeat ≥ 180 or tools gone → the cockpit is down, log it and use the `/ship` Phase 4 mechanics.
   - "no CI run exists" → the repo has no CI for this PR: log it and continue at Phase 5.
5. **Denials.** A `ship-cockpit:` denial is final; never rephrase a command to get past it. A cap denial means Phase 6 needs-attention. Pushes in `claude-code-i14u` are exempt so learnings still merge.
6. **Models.** Keep the main conversation on one model; the cockpit raises effort to max once if the run gets stuck. Send search to `ship-cockpit:scout`, unexplained CI failures to `ship-cockpit:ci-triage`, decided mechanical edits to `ship-cockpit:mechanic`.
7. **Phase 6.** Call `status({ issue, digest: true })` and put its `summary` and `digest` in the final summary, then `run_end({ issue, outcome, reason })` with `green`, `green-design-pending` or `needs-attention`. Still send the `/ship` push notification, and say whether the cockpit ever fell back. The learnings handoff comes after `run_end`.
