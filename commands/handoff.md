Create a handoff document from this conversation for an implementation agent (Claude Code, Cursor or a human) to pick up later. Method, template and anti-patterns: `~/.claude/skills/dev-workflow/handoff.md` — read it before writing.

1. **Check there is something to hand off.** No prior planning → "We haven't planned anything yet — what's the task?" and stop.
2. **Target repo:** the repo the work belongs to, which may differ from the cwd. It sets the `**Project:**` header and the filename tag.
3. **Single or multi-task:** several issues/titles in `$ARGUMENTS`, or several distinct tasks planned → one doc per task plus an index. Ambiguous → ask.
4. **Filename:** per the skill (`issue-42` → title → topic), suffixed `-$(date +%Y-%m-%d-%H%M)`. `mkdir -p ~/.claude/handoffs`.
5. **Synthesize** the template: compress, keep every decision's why, inline every load-bearing fact into Key facts, tool-neutral steps, honest `TBD:` markers.
6. **Write** the doc(s) to `~/.claude/handoffs/` (never a repo's `.claude/`).
7. **GitHub sync:** if a task has an issue, post its Plan + Decisions made + Out of scope as an issue comment (`gh issue comment`). On failure, note it and continue.
8. **Print** one `Handoff saved: <path>` line per doc (plus `Index saved:`), then the Claude Code and Cursor resume lines from the template (pointed at the index for a set), and `Issue updated: <URL>` if step 7 ran.

**Never implement anything** here: no code edits, branches or validation runs.
