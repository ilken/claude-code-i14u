# Claude Code Config (i14u)

One-command setup for Claude Code with native skills, RALF methodology, deterministic hooks, and three operating modes (Solo Dev, Team Lead, Project Lead).

## What You Get

| Feature | Description |
|---------|-------------|
| **CLAUDE.md Orchestrator** | Auto-loads globally — methodology, modes, guardrails |
| **Native Skills** | Auto-triggering skills for workflow, debugging, design, and per-stack conventions |
| **RALF Loop** | Read, Analyse+Plan, Implement+Lint, Feedback — enforced for every task |
| **GSD Principles** | 9 working principles: bias to action, ship over perfect, cut scope, etc. |
| **Solo Dev Mode** | Single-agent Claude gated by native plan mode |
| **Team Lead Mode** | Multi-agent mode using native agents spawned via the `Agent` tool |
| **Project Lead Mode** | Decomposes GitHub PRDs into dependency-ordered issues |
| **Hooks** | Branch protection (blocks commits to main), prettier-on-edit, push log, done notification |
| **MCP Servers** | Context7 (docs), Shadcn, Iconify, 21st.dev, Brave Search |
| **Security Defaults** | Hardened allow/deny lists blocking destructive commands |

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Node.js >= 18** ([download](https://nodejs.org))

The setup script will install everything else automatically (Homebrew, jq, Claude Code).

## Quick Start

```bash
git clone https://github.com/ilken/claude-code-i14u.git ~/Developer/claude-code-i14u
cd ~/Developer/claude-code-i14u
chmod +x setup.sh
./setup.sh
```

The script will:

1. Install [Homebrew](https://brew.sh) (if missing)
2. Check for / install [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
3. Merge `~/.claude/settings.json` with secure defaults and hooks
4. Install global npm tools (uipro-cli, Playwright)
5. Configure MCP servers (Context7, Shadcn, Iconify, 21st.dev)
6. Set up iTerm2 profiles for solo and team modes
7. Symlink `claude-solo`, `claude-team`, and `claude-lead` to `/usr/local/bin`
8. Symlink `CLAUDE.md` orchestrator to `~/.claude/CLAUDE.md`
9. Install global commands to `~/.claude/commands/`
10. Symlink native skills to `~/.claude/skills/`
11. Symlink team agents to `~/.claude/agents/`

## How It Works

After running `setup.sh`, the orchestrator `CLAUDE.md` is symlinked to `~/.claude/CLAUDE.md`. This means it auto-loads whenever you run Claude from **any** project. Skills are installed natively, so Claude triggers them automatically from their descriptions — no manual loading.

### Day-to-Day Workflow

```bash
# 1. Navigate to any project
cd ~/Developer/my-project

# 2. Start Claude in solo mode (or team mode for large tasks)
claude-solo

# 3. Give it a task — Claude will automatically:
#    - Trigger relevant skills (dev-workflow, per-stack conventions, design)
#    - Follow the RALF loop: read → plan (plan mode approval) → implement → validate
#    - Create a conventional commit on a branch and open a PR
```

### Solo vs Team Mode

| | Solo (`claude-solo`) | Team (`claude-team`) |
|---|---|---|
| **Best for** | Small/medium tasks (< 10 files) | Large, cross-module tasks |
| **How it works** | One Claude instance follows RALF | Team lead orchestrates native agents via the `Agent` tool |
| **You control** | Approve the plan, then Claude executes | Approve the plan, then agents coordinate |

## Architecture

```
~/Developer/
└── claude-code-i14u/
    ├── CLAUDE.md                      ← source file (symlinked to ~/.claude/CLAUDE.md)
    ├── skills/                        ← native skills (symlinked into ~/.claude/skills/)
    │   ├── dev-workflow/              ← RALF loop, validation, self-review, commits, PRs
    │   ├── debug-mode/                ← systematic debugging methodology
    │   ├── new-project-setup/         ← scaffold blueprint + checklist
    │   ├── web-ui-design/             ← design philosophy, component patterns, brand templates
    │   ├── app/                       ← app-dev: React Native / Expo conventions
    │   ├── backend/                   ← backend-dev: NestJS conventions
    │   ├── web/                       ← web-dev: Next.js conventions
    │   ├── ui-ux-pro-max/             ← design system database + search scripts
    │   ├── shared/                    ← lead-workflow (Project Lead mode reference)
    │   └── memory/
    │       └── learnings.md           ← persistent learnings (Claude appends here)
    ├── agents/                        ← team agents (symlinked into ~/.claude/agents/)
    │   ├── pikachu.md                 ← implementer (opus)
    │   ├── charmander.md              ← reviewer & security (sonnet, read-only)
    │   ├── squirtle.md                ← test engineer (sonnet)
    │   └── bulbasaur.md               ← QA & sign-off (sonnet, read-only)
    ├── .claude/commands/              ← slash commands (installed to ~/.claude/commands/)
    ├── config/
    │   ├── claude-settings.json       ← settings + hooks (merged into ~/.claude/settings.json)
    │   ├── solo-system-prompt.md
    │   ├── team-system-prompt.md
    │   └── lead-system-prompt.md
    ├── plans/                         ← plan files (one per project/feature, checkbox steps)
    └── bin/
        ├── claude-solo
        ├── claude-team
        └── claude-lead
```

## RALF Loop

Every task follows this methodology:

| Phase | What happens |
|-------|-------------|
| **R**ead | Read the task, referenced files, relevant skills, and memory/learnings |
| **A**nalyse + Plan | Assess scope, create a plan, get approval via plan mode; non-trivial plans are saved to `plans/` with checkboxes |
| **L**int + Implement | Write code (test-first for bug fixes), run validation commands, fix in a loop until clean |
| **F**eedback | Verify behavior, summarize, note learnings, push and open a PR |

The full methodology is in `skills/dev-workflow/ralf-loop.md`.

## GSD Principles

1. **Bias to action** — start with the simplest approach, iterate
2. **Ship over perfect** — working code beats elegant code that's late
3. **Cut scope ruthlessly** — do the minimum that solves the problem
4. **One thing at a time** — finish the current task before starting another
5. **Fail fast** — if an approach isn't working after 2 attempts, try a different angle
6. **No gold-plating** — don't add features, refactor, or improve beyond what was asked
7. **Ask when stuck** — if blocked for more than 5 minutes, ask the user
8. **Leave it better** — fix small issues you encounter but don't refactor
9. **Pause on complexity** — briefly ask "is there a simpler way?" before committing to a non-trivial approach

## Usage

### Solo Dev Mode

```bash
claude-solo
```

Opens Claude Code in plan mode with the RALF system prompt. Claude reads the task, presents a plan through native plan mode, implements after approval, and validates in a loop. Obvious ≤3-file bug fixes skip planning.

### Team Lead Mode

```bash
claude-team
```

Opens Claude Code as a team lead. After you approve the plan, it spawns the native agents from `~/.claude/agents/` (parallel work runs in isolated git worktrees):

| Agent | Model | Role |
|-------|-------|------|
| **pikachu** | Opus | Implementer — writes production code |
| **charmander** | Sonnet | Reviewer & Security — read-only code review, security audit |
| **squirtle** | Sonnet | Test Engineer — tests + performance notes |
| **bulbasaur** | Sonnet | QA — runs full validation, final sign-off |

### Project Lead Mode

```bash
claude-lead
```

Reads a GitHub PRD issue, explores the codebase, and decomposes the project into dependency-ordered GitHub issues (3-8 files each, with acceptance criteria) after your approval.

## Hooks

Configured in `config/claude-settings.json` and merged into `~/.claude/settings.json`:

| Hook | Event | What it does |
|------|-------|--------------|
| Branch protection | PreToolUse (Bash) | Blocks `git commit` on `main`/`master` (exit 2) |
| Auto-format | PostToolUse (Edit/Write) | Runs the project's local prettier on edited files, if installed |
| Push log | PostToolUse (Bash) | Appends remote + branch to `~/.claude/push.log` on every push |
| Done notification | Stop | macOS notification when Claude finishes |

Per-project validation hooks (typecheck on Stop) are documented in `skills/dev-workflow/changes-validation.md`.

## Security Settings

### Auto-Approved (Allow List)

Safe, everyday operations: file reading (Read, Glob, Grep), safe git (status, diff, log, branch, checkout, add, commit), dev tools (npm, npx, node, tsc, eslint, prettier), non-destructive filesystem (ls, cat, head, tail, find, mkdir, cp, mv), configured MCP servers.

### Hard-Blocked (Deny List)

| Category | Blocked Commands |
|----------|-----------------|
| Destructive filesystem | `rm -rf`, `rm -r /`, `sudo *` |
| Dangerous permissions | `chmod 777` |
| Destructive git | `push --force`, `reset --hard`, `clean -fd` |
| Remote code execution | `curl \| sh`, `wget \| bash` |
| System-level | `dd`, `mkfs`, `shutdown`, `reboot`, `kill -9`, `killall` |
| Publishing | `npm publish` |
| Container destruction | `docker rm`, `docker rmi`, `docker system prune` |
| Database destruction | `DROP DATABASE`, `DROP TABLE`, `truncate` |
| Secret exfiltration | `.env`, `.pem`, `.key`, credentials; `env`/`printenv`; `ssh`/`scp` |

## Troubleshooting

**"claude: command not found"** — Install Claude Code: `npm install -g @anthropic-ai/claude-code`

**CLAUDE.md not loading** — Verify the symlink: `ls -la ~/.claude/CLAUDE.md` should point to `claude-code-i14u/CLAUDE.md`.

**Skills not triggering** — Verify symlinks: `ls -la ~/.claude/skills/` should point into `claude-code-i14u/skills/`. Re-run `setup.sh` if missing.

## License

MIT
