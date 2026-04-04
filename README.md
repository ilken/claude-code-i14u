# Claude Code Config (i14u)

One-command setup for Claude Code with a unified skills architecture, RALF methodology, and two operating modes (Solo Dev and Team Lead). Includes shared methodology skills, MCP servers, hardened security settings, and a Warp terminal setup.

## What You Get

| Feature | Description |
|---------|-------------|
| **CLAUDE.md Orchestrator** | Auto-loads globally, loads relevant skills |
| **Skills Architecture** | Shared methodology and project-agnostic conventions |
| **RALF Loop** | Read, Analyse+Plan, Implement+Lint, Feedback — enforced for every task |
| **GSD Principles** | 8 working principles: bias to action, ship over perfect, cut scope, etc. |
| **Solo Dev Mode** | Single-agent Claude that follows RALF and asks before implementing |
| **Team Lead Mode** | Multi-agent setup with 4 specialized teammates via tmux |
| **MCP Servers** | Context7 (docs), Brave Search |
| **Security Defaults** | Hardened allow/deny lists blocking destructive commands |
| **Warp Terminal** | Setup instructions for "Claude Team" launch config |

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Node.js >= 18** ([download](https://nodejs.org))

The setup script will install everything else automatically (Homebrew, Warp, tmux, Claude Code).

## Quick Start

```bash
git clone https://github.com/ilken/claude-code-i14u.git ~/Developer/claude-code-i14u
cd ~/Developer/claude-code-i14u
chmod +x setup.sh
./setup.sh
```

The script will:

1. Install [Homebrew](https://brew.sh) (if missing)
2. Install [Warp](https://www.warp.dev) via Homebrew
3. Install [tmux](https://github.com/tmux/tmux/wiki) via Homebrew
4. Check for / install [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
5. Configure `~/.claude/settings.json` with secure defaults
6. Add the [Context7 MCP](https://context7.com) server
7. Install tmux config optimized for Claude Team mode
8. Print Warp "Claude Team" launch config setup instructions
9. Symlink `claude-solo`, `claude-team`, and `claude-lead` to `/usr/local/bin`
10. Symlink `CLAUDE.md` orchestrator to `~/.claude/CLAUDE.md`

## How It Works

After running `setup.sh`, the orchestrator `CLAUDE.md` is symlinked to `~/.claude/CLAUDE.md`. This means it auto-loads whenever you run Claude from **any** project.

### Day-to-Day Workflow

```bash
# 1. Navigate to any project
cd ~/Developer/my-project

# 2. Start Claude in solo mode (or team mode for large tasks)
claude-solo

# 3. Give it a task — Claude will automatically:
#    - Load relevant shared skills on demand
#    - Follow the RALF loop: read → plan → ask approval → implement → validate
#    - Create a conventional commit when done
```

### Solo vs Team Mode

| | Solo (`claude-solo`) | Team (`claude-team`) |
|---|---|---|
| **Best for** | Small/medium tasks (< 10 files) | Large, cross-module tasks |
| **How it works** | One Claude instance follows RALF | Team lead + 4 specialized agents in tmux |
| **You control** | Approve the plan, then Claude executes | Approve the plan, then agents coordinate |

### What Gets Loaded Automatically

1. `CLAUDE.md` orchestrator (via symlink) — RALF loop, GSD principles
2. Shared skills — loaded on demand (commits, validation, debugging, etc.)
3. Memory — `skills/memory/learnings.md` for past insights

Skills are loaded **lazily** — Claude only reads what's relevant to the current task.

## Architecture

```
~/Developer/
└── claude-code-i14u/
    ├── CLAUDE.md                      ← source file (symlinked to ~/.claude/CLAUDE.md)
    ├── skills/
    │   ├── shared/                    ← cross-project methodology
    │   │   ├── ralf-loop.md
    │   │   ├── conventional-commits.md
    │   │   ├── gsd-principles.md
    │   │   ├── changes-validation.md
    │   │   ├── pr-workflow.md
    │   │   ├── debug-mode.md
    │   │   ├── frontend-design.md
    │   │   └── new-project-setup.md
    │   ├── ui-ux-pro-max/             ← design system database + search scripts
    │   └── memory/
    │       └── learnings.md           ← persistent learnings (Claude appends here)
    ├── config/
    │   ├── claude-settings.json
    │   ├── solo-system-prompt.md
    │   ├── team-system-prompt.md
    │   └── tmux.conf
    ├── plans/                         ← team mode orchestration plans (per project)
    ├── commands/                      ← custom slash commands
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
| **A**nalyse + Plan | Assess scope and complexity, create an implementation plan, get user approval |
| **L**int + Implement | Write code, run validation commands, fix in a loop until clean |
| **F**eedback | Summarize what was done, note learnings, create conventional commit |

The full methodology is in `skills/shared/ralf-loop.md`.

## GSD Principles

1. **Bias to action** — start with the simplest approach, iterate
2. **Ship over perfect** — working code beats elegant code that's late
3. **Cut scope ruthlessly** — do the minimum that solves the problem
4. **One thing at a time** — finish the current task before starting another
5. **Fail fast** — if an approach isn't working after 2 attempts, try a different angle
6. **No gold-plating** — don't add features, refactor, or improve beyond what was asked
7. **Ask when stuck** — if blocked for more than 5 minutes, ask the user
8. **Leave it better** — fix small issues you encounter but don't refactor

## Usage

### Solo Dev Mode

```bash
claude-solo
```

Opens Claude Code with a system prompt that enforces the RALF loop. Claude will:
- Load relevant shared skills on demand
- Read the task thoroughly
- Create a plan and ask for approval
- Only implement after you say go
- Run validation commands and fix issues

### Team Lead Mode

```bash
claude-team
```

Opens Claude Code as a team lead with tmux split panes. After you approve the plan, it spawns 4 agent teammates:

| Agent | Model | Role |
|-------|-------|------|
| **Pikachu** | Opus | Implementer — writes production code |
| **Charmander** | Sonnet | Reviewer & Security — code review, security audit |
| **Squirtle** | Sonnet | Test Engineer or Security & Performance (varies by plan) |
| **Bulbasaur** | Sonnet | QA & Compliance — final validation, compliance checks |

### MCP Servers

| Server | Purpose | Setup |
|--------|---------|-------|
| **Context7** | Fetch up-to-date library documentation | Auto-configured by setup.sh |
| **Brave Search** | Web search for research | `claude mcp add-json brave-search '{"command":"npx","args":["-y","@anthropic-ai/brave-search-mcp@latest"],"env":{"BRAVE_API_KEY":"your-key"}}'` |

## Security Settings

### Auto-Approved (Allow List)

Safe, everyday operations: file reading (Read, Glob, Grep), safe git (status, diff, log, branch, checkout, add, commit), dev tools (npm, npx, node, tsc, eslint, prettier), non-destructive filesystem (ls, cat, head, tail, find, mkdir, cp, mv), Context7 MCP.

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

**"tmux: command not found"** — Install tmux: `brew install tmux`

**CLAUDE.md not loading** — Verify the symlink: `ls -la ~/.claude/CLAUDE.md` should point to `claude-code-i14u/CLAUDE.md`.

## License

MIT
