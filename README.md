# Claude Code Config (i14u)

One-command setup for Claude Code on this laptop: a global CLAUDE.md orchestrator, native skills, RALF methodology, guard hooks, autonomous `/ship` flows, and solo/team/lead modes. The personal counterpart of the work `claude-code-config`, without CircleCI, CodeRabbit, Codex, Linear or Slack: GitHub issues are the tickets, GitHub Actions is CI, and a fresh-context **Opus** agent is the reviewer.

## What You Get

| Feature | Description |
|---------|-------------|
| **CLAUDE.md Orchestrator** | Auto-loads globally: core principles, RALF, model selection, quick-start map, guardrails |
| **Native Skills** | Auto-triggering: dev-workflow, debug-mode, browser-qa, design, per-stack (app/backend/web) |
| **`/ship`** | Issue → plan → implement → design check → Opus review → PR → CI fix loop → green → notify, unattended |
| **`/mod:ship`** | The same, with the `ship-cockpit` mod polling CI, waking the session, enforcing caps, drawing a pane |
| **`/ship-milestone`** | Every open issue in a GitHub milestone, in dependency order, each shipped and merged |
| **Review** | `charmander` on Opus, four axes + security, debate protocol (`/code:review`, `/code:review-fix`) |
| **Hooks** | branch-guard (no commits on main), rm-guard (`rm -rf` only in worktrees), pr-check (short comments and PR bodies), prettier-on-edit, push log, done notification |
| **Modes** | Solo (default), Team (pikachu/charmander/squirtle/bulbasaur), Project Lead (PRD → issues) |
| **MCP Servers** | Context7, Shadcn, Iconify, 21st.dev |

Built for the **agents view**: sessions run as background jobs in their own worktree, so every rule lives in CLAUDE.md and the skills rather than a launcher prompt.

## Quick Start

```bash
git clone https://github.com/ilken/claude-code-i14u.git ~/Developer/claude-code-i14u
cd ~/Developer/claude-code-i14u && ./setup.sh
```

It merges `config/claude-settings.json` into `~/.claude/settings.json` (hooks, env, permissions, the mod's plugin dir), symlinks `CLAUDE.md`, `commands/`, the skills and the agents into `~/.claude/`, and installs the launchers, MCP servers and iTerm2 profiles. Everything is symlinked, so `git pull` on `main` is a deploy.

## Day to day

| You want to | Run |
|---|---|
| Ship an issue, hands-off | `/ship 42` (or `/mod:ship 42`), from a background session in the repo |
| Ship a milestone | `/ship-milestone "v1"` — `--plan` to see the order first |
| Review a PR or branch | `/code:review 17` · fix findings: `/code:review-fix 17` |
| Validate, retro, clean worktrees | `/code:validate` · `/code:retro` · `/code:cleanup-worktrees` |
| See a web page you changed | `/web:qa /settings` |
| Snapshot a plan for later | `/handoff` · `/handoff:list` |
| Idea → PRD → issues | `/project:brainstorm` → `/project:brainstorm-to-prd` → `/project:prd-to-git-project` |
| Perf / tech-debt scan | `/code:perf-check` · `/code:tech-debt` |

## Architecture

```
claude-code-i14u/
├── CLAUDE.md             ← orchestrator (→ ~/.claude/CLAUDE.md)
├── commands/             ← slash commands (→ ~/.claude/commands); code/, git/, mod/, web/, handoff/, project/, startup/
├── skills/               ← native skills (each → ~/.claude/skills/<name>)
│   ├── dev-workflow/     ← RALF, validation, self-review, comments, writing, models, grilling, review, worktrees, handoff, PRs
│   ├── debug-mode/  browser-qa/  new-project-setup/  web-ui-design/  ui-ux-pro-max/
│   ├── app/  backend/  web/   ← app-dev, backend-dev, web-dev
│   ├── shared/lead-workflow.md
│   └── memory/learnings.md
├── agents/               ← pikachu, charmander (Opus reviewer), squirtle, bulbasaur (→ ~/.claude/agents)
├── mods/ship-cockpit/    ← the /mod:ship mod (loaded via CLAUDE_CODE_PLUGIN_DIRS)
├── bin/                  ← launchers + branch-guard, rm-guard, pr-check, cleanup-worktrees, session-digest
├── config/               ← claude-settings.json, mode system prompts, iTerm2, tmux
└── plans/                ← one plan file per project/feature
```

## Core Principles

1. Never guess — find it and cite it. 2. Minimum that solves the problem, in code and prose. 3. Touch only what you must. 4. Define success, loop until verified. 5. Bias to action, fail fast. 6. Pause on complexity, briefly. 7. Comments are for decisions, not narration. Full text in `CLAUDE.md`.

## Checks

```bash
claude plugin validate mods/ship-cockpit && claude plugin test mods/ship-cockpit   # after each Claude Code update
bin/pr-check.sh --body /path/to/body.md                                            # what the gh pr create hook runs
```

## Troubleshooting

- **CLAUDE.md / commands / skills not loading** — `ls -la ~/.claude/CLAUDE.md ~/.claude/commands ~/.claude/skills/` should point into this repo; re-run `setup.sh`.
- **`/mod:ship` says the mod isn't loaded** — check `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`, start a new session.
- **A commit is blocked** — you're on `main`; branch first. Never bypass the hook.

## License

MIT
