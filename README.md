# Claude Code Config

One-command setup for Claude Code with a unified skills architecture, RALF methodology, and two operating modes (Solo Dev and Team Lead). Includes project-specific skills migrated from cursor rules, Linear integration, MCP servers, hardened security settings, and an iTerm2 profile.

## What You Get

| Feature | Description |
|---------|-------------|
| **CLAUDE.md Orchestrator** | Auto-loads for all sibling projects, detects project type, loads relevant skills |
| **Skills Architecture** | Project-specific conventions and patterns (backend, app, web) + shared methodology |
| **RALF Loop** | Read, Analyse+Plan, Implement+Lint, Feedback — enforced for every task |
| **GSD Principles** | 8 working principles: bias to action, ship over perfect, cut scope, etc. |
| **Solo Dev Mode** | Single-agent Claude that follows RALF and asks before implementing |
| **Team Lead Mode** | Multi-agent setup with 4 specialized teammates via tmux |
| **Plan Templates** | Pre-built orchestration plans for Backend, Mobile App, and Web projects |
| **Linear Integration** | `/linear TICKET` command reads tickets and creates plans |
| **MCP Servers** | Linear, Context7 (docs), Brave Search |
| **Security Defaults** | Hardened allow/deny lists blocking destructive commands |
| **iTerm2 Profile** | "Claude Team" profile with Ctrl+Cmd+L hotkey |

## Prerequisites

- **macOS** (Apple Silicon or Intel)
- **Node.js >= 18** ([download](https://nodejs.org))

The setup script will install everything else automatically (Homebrew, iTerm2, tmux, Claude Code).

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-config.git
cd claude-code-config
chmod +x setup.sh
./setup.sh
```

The script will:

1. Install [Homebrew](https://brew.sh) (if missing)
2. Install [iTerm2](https://iterm2.com) via Homebrew
3. Install [tmux](https://github.com/tmux/tmux/wiki) via Homebrew
4. Check for / install [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
5. Configure `~/.claude/settings.json` with secure defaults
6. Add the [Linear MCP](https://linear.app/integrations/claude) server
7. Install the `/linear` custom slash command
8. Install tmux config optimized for Claude Team mode
9. Install the iTerm2 "Claude Team" dynamic profile
10. Symlink `claude-solo` and `claude-team` to `/usr/local/bin`
11. Symlink `CLAUDE.md` orchestrator to `~/Documents/GitHub/`

## How It Works

After running `setup.sh`, the orchestrator `CLAUDE.md` is symlinked to `~/Documents/GitHub/`. This means it auto-loads whenever you run Claude from **any** sibling project.

### Day-to-Day Workflow

```bash
# 1. Navigate to any project
cd ~/Documents/GitHub/equals-client-be

# 2. Start Claude in solo mode (or team mode for large tasks)
claude-solo

# 3. Give it a task — Claude will automatically:
#    - Detect project type (Backend) from your cwd
#    - Load relevant skills (architecture, prisma, graphql, etc.) on demand
#    - Follow the RALF loop: read → plan → ask approval → implement → validate
#    - Use correct validation commands (yarn code:full-lint for BE)
#    - Create a conventional commit when done
```

### With Linear Tickets

```bash
cd ~/Documents/GitHub/equals-client-app
claude-solo
# Inside Claude:
/linear EQLS-1234
# Claude reads the ticket, creates a plan, asks for your approval
```

### Solo vs Team Mode

| | Solo (`claude-solo`) | Team (`claude-team`) |
|---|---|---|
| **Best for** | Small/medium tasks (< 10 files) | Large, cross-module tasks |
| **How it works** | One Claude instance follows RALF | Team lead + 4 specialized agents in tmux |
| **You control** | Approve the plan, then Claude executes | Approve the plan, then agents coordinate |

### What Gets Loaded Automatically

1. `CLAUDE.md` orchestrator (via symlink) — project detection, RALF loop, GSD principles
2. Shared skills — loaded on demand (commits, validation, debugging, etc.)
3. Project skills — loaded on demand based on task context (e.g., `skills/backend/prisma.md` only when working with Prisma)
4. Memory — `skills/memory/learnings.md` for past insights

Skills are loaded **lazily** — Claude only reads what's relevant to the current task, not everything at once.

## Architecture

```
~/Documents/GitHub/
├── CLAUDE.md                          ← orchestrator (symlinked from claude-code-config/CLAUDE.md)
├── equals-client-be/                  (auto-detected as Backend)
├── equals-client-app/                 (auto-detected as App)
├── equals-client-web/                 (auto-detected as Web)
└── claude-code-config/
    ├── CLAUDE.md                      ← source file (symlinked to parent)
    ├── skills/
    │   ├── shared/                    ← cross-project methodology
    │   │   ├── ralf-loop.md
    │   │   ├── conventional-commits.md
    │   │   ├── gsd-principles.md
    │   │   ├── changes-validation.md
    │   │   ├── linear-workflow.md
    │   │   └── debug-mode.md
    │   ├── backend/                   ← NestJS, Prisma, GraphQL
    │   │   ├── architecture.md
    │   │   ├── prisma.md
    │   │   ├── graphql.md
    │   │   ├── data-objects.md
    │   │   ├── testing.md
    │   │   ├── queue-processing.md
    │   │   ├── configuration.md
    │   │   └── domain-knowledge.md
    │   ├── app/                       ← React Native, Expo, Jotai
    │   │   ├── architecture.md
    │   │   ├── typescript-react.md
    │   │   ├── styling.md
    │   │   ├── performance.md
    │   │   ├── testing.md
    │   │   ├── chat-navigation.md
    │   │   └── ab-testing.md
    │   ├── web/                       ← Next.js, TailwindCSS, React Query
    │   │   ├── architecture.md
    │   │   ├── graphql-react-query.md
    │   │   ├── styling.md
    │   │   ├── testing.md
    │   │   └── security.md
    │   └── memory/
    │       └── learnings.md           ← persistent learnings (Claude appends here)
    ├── config/
    │   ├── claude-settings.json
    │   ├── solo-system-prompt.md
    │   ├── team-system-prompt.md
    │   ├── tmux.conf
    │   └── iterm2-team-profile.json
    ├── plans/
    │   ├── backend.md
    │   ├── app.md
    │   └── web.md
    ├── commands/
    │   └── linear.md
    └── bin/
        ├── claude-solo
        └── claude-team
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

## Skills

Skills are organized by project type. The CLAUDE.md orchestrator detects the project and loads relevant skills lazily (only what's needed for the current task).

| Category | Skills | Source |
|----------|--------|--------|
| **Shared** | RALF loop, conventional commits, GSD principles, validation, Linear workflow, PR workflow, debug mode | New + merged from cursor rules |
| **Backend** | Architecture, Prisma, GraphQL, data objects, testing, queue processing, configuration, domain knowledge | Migrated from `equals-client-be` cursor rules and skills |
| **App** | Architecture, TypeScript/React, styling, performance, testing, chat navigation, A/B testing | Migrated from `equals-client-app` cursor rules |
| **Web** | Architecture, GraphQL + React Query, styling, testing, security | Extracted from `plans/web.md` |
| **Memory** | Learnings file — Claude appends reusable insights after tasks | New |

## Usage

### Solo Dev Mode

```bash
claude-solo
```

Opens Claude Code with a system prompt that enforces the RALF loop. Claude will:
- Detect the project type and load matching skills
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

### Validation Commands

| Project | Command |
|---------|---------|
| Backend | `yarn code:full-lint && yarn test:local -- {file}` |
| App | `yarn code:full-lint` |
| Web | `npm run lint && npm run typecheck && npm run build` |

### Linear Integration

First-time setup:

1. Start Claude: `claude-solo`
2. Run `/mcp` to authenticate with Linear (opens browser for OAuth)
3. Once authenticated, you're set

Using it:

```
/linear EQLS-1234
```

This reads the Linear ticket and creates an implementation plan following the RALF loop.

### MCP Servers

| Server | Purpose | Setup |
|--------|---------|-------|
| **Linear** | Read tickets, extract requirements | Auto-configured by setup.sh |
| **Context7** | Fetch up-to-date library documentation | `claude mcp add-json context7 '{"command":"npx","args":["-y","@anthropic-ai/context7-mcp@latest"]}'` |
| **Brave Search** | Web search for research | `claude mcp add-json brave-search '{"command":"npx","args":["-y","@anthropic-ai/brave-search-mcp@latest"],"env":{"BRAVE_API_KEY":"your-key"}}'` |

## Plan Templates

Both Solo and Team modes auto-detect the project type and load the corresponding plan template from `plans/`.

| Plan | File | Stack |
|------|------|-------|
| **Backend** | `plans/backend.md` | NestJS, Prisma, GraphQL, Bull queues |
| **Mobile App** | `plans/app.md` | React Native, Expo, Jotai, React Query |
| **Web** | `plans/web.md` | Next.js (App Router), GraphQL, TailwindCSS, React Query |

### Orchestration Flow (Team Mode)

```
Human provides task → Team Lead plans → Human approves
  → Pikachu implements → Charmander reviews → Pikachu addresses feedback
  → Squirtle tests/audits → Charmander re-reviews → Bulbasaur validates → Done
```

Max 3 full cycles. `BLOCKED` status escalates to human immediately.

## Security Settings

### Auto-Approved (Allow List)

Safe, everyday operations: file reading (Read, Glob, Grep), safe git (status, diff, log, branch, checkout, add, commit), dev tools (npm, npx, node, tsc, eslint, prettier), non-destructive filesystem (ls, cat, head, tail, find, mkdir, cp, mv), Linear MCP.

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

## Customization

### Modify Skills

Edit the markdown files in `skills/` to change conventions, patterns, or standards. Changes take effect immediately (Claude reads skills on demand).

### Add a New Project Type

1. Create a new skill directory: `skills/{project}/`
2. Add skill files for the project's conventions
3. Create a plan template: `plans/{project}.md`
4. Update `CLAUDE.md` to include the new project in detection and skills loading

### Modify the /linear Command

Edit `commands/linear.md`, then re-run `./setup.sh` (or copy to `~/.claude/commands/linear.md`).

## Troubleshooting

**"claude: command not found"** — Install Claude Code: `npm install -g @anthropic-ai/claude-code`

**"tmux: command not found"** — Install tmux: `brew install tmux`

**Linear MCP not working** — Run `/mcp` inside Claude to re-authenticate.

**iTerm2 shortcut not working** — Open iTerm2 Settings > Profiles, verify "Claude Team" appears.

**CLAUDE.md not loading** — Verify the symlink: `ls -la ~/Documents/GitHub/CLAUDE.md` should point to `claude-code-config/CLAUDE.md`.

## License

MIT
