# Claude Code Config

One-command setup for the best Claude Code configuration. Includes two operating modes (Solo Dev and Team Lead), project-specific plan templates, Linear integration, hardened security settings, and an iTerm2 profile with a keyboard shortcut.

## What You Get

| Feature | Description |
|---------|-------------|
| **Solo Dev Mode** | Single-agent Claude that plans first and asks before implementing |
| **Team Lead Mode** | Multi-agent setup with 4 specialized teammates via tmux |
| **Plan Templates** | Pre-built orchestration plans for Backend, Mobile App, and Web projects |
| **Linear Integration** | `/linear TICKET` command reads tickets and creates plans |
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

## Manual Installation

If you prefer to install dependencies yourself:

### Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### iTerm2

```bash
brew install --cask iterm2
```

### tmux

```bash
brew install tmux
```

### Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Then run `./setup.sh` to configure everything.

## Usage

### Solo Dev Mode

```bash
claude-solo
```

Opens Claude Code with verbose output and a system prompt that enforces:
- Detect project type and load the matching plan template (backend / app / web)
- Read the task/context thoroughly first
- Create a detailed plan following the plan template's standards and conventions
- Present the plan and **ask for your approval**
- Only implement after you say go

### Team Lead Mode

```bash
claude-team
```

Opens Claude Code as a team lead with tmux split panes. It detects your project type, loads the matching plan template, and after you approve the plan, spawns **4 agent teammates**:

| Agent | Model | Role |
|-------|-------|------|
| **Pikachu** | Opus | Implementer — writes production code |
| **Charmander** | Sonnet | Reviewer & Security — code review, security audit |
| **Squirtle** | Sonnet | Test Engineer or Security & Performance (varies by plan) |
| **Bulbasaur** | Sonnet | QA & Compliance — final validation, compliance checks |

The team lead (**Ash**) coordinates only (delegate mode) and does not write code itself. Agents follow a structured orchestration protocol with handoff messages, feedback loops, and loop limits defined in the plan template.

### tmux Configuration

The setup installs a tmux config (`~/.tmux.conf`) optimized for Claude Team mode:

| Setting | Value | Why |
|---------|-------|-----|
| Mouse mode | On | Scroll output and click between agent panes |
| Base index | 1 | Window/pane numbering starts at 1 (easier to reach) |
| Scrollback | 50,000 lines | Large buffer for verbose Claude output |
| Terminal | screen-256color | Proper color rendering for Claude's output |

If you already have a `~/.tmux.conf`, the setup appends these settings rather than overwriting.

### iTerm2 Shortcut

Press **Ctrl+Cmd+L** to open a dedicated iTerm2 window that auto-launches Team Lead mode. The window reuses your previous session's directory.

### Linear Integration

First-time setup:

1. Start Claude: `claude-solo`
2. Run `/mcp` to authenticate with Linear (opens browser for OAuth)
3. Once authenticated, you're set

Using it:

```
/linear LIN-123
```

This reads the Linear ticket and:
1. Summarizes all ticket details (title, description, acceptance criteria, priority, etc.)
2. Identifies dependencies and blockers
3. Creates a detailed implementation plan
4. Asks for your approval before doing anything

Works in both Solo and Team modes.

## Plan Templates

Both Solo and Team modes auto-detect the project type and load the corresponding plan template from the `plans/` directory. Each plan defines coding standards, agent roles, orchestration protocols, checklists, and workflow lifecycles.

| Plan | File | Stack | Agents |
|------|------|-------|--------|
| **Backend** | `plans/backend.md` | NestJS, Prisma, GraphQL, Bull queues | Pikachu (Implementer), Charmander (Reviewer & Security), Squirtle (Test Engineer), Bulbasaur (QA & Compliance) |
| **Mobile App** | `plans/app.md` | React Native, Expo, Jotai, React Query | Pikachu (Implementer), Charmander (Code Reviewer), Squirtle (Security & Performance), Bulbasaur (QA & Compliance) |
| **Web** | `plans/web.md` | Next.js (App Router), GraphQL, TailwindCSS, React Query, TypeScript | Pikachu (Implementer), Charmander (Reviewer & Security), Squirtle (Test Engineer), Bulbasaur (QA & Compliance) |

### How Plans Work

1. Claude detects the project type by analyzing the codebase (package.json, file structure, framework markers)
2. It loads the matching plan template and follows its conventions
3. In **Solo mode**: Claude uses the plan's standards, naming conventions, and validation commands as its guide
4. In **Team mode**: Claude spawns the 4 agents defined in the plan, passes each agent its full role definition, and orchestrates them following the plan's execution order and feedback loops

### Orchestration Flow (Team Mode)

All plans follow the same high-level flow:

```
Human provides task → Team Lead creates plan → Human approves
  → Pikachu implements → Charmander reviews → Pikachu addresses feedback
  → Squirtle tests/audits → Charmander re-reviews → Bulbasaur validates → Done
```

Each agent uses structured handoff messages (`PASS` / `NEEDS_WORK` / `BLOCKED`) and there are hard loop limits (max 3 full cycles) to prevent infinite iteration.

### Adding a New Plan

Create a new `.md` file in `plans/` following the same structure as the existing plans. Then update the system prompts in `config/` to reference it. The plan should include:
- Team roster with agent roles
- Orchestration protocol and communication contract
- Agent definitions (identity prompt, responsibilities, standards, checklists)
- Workflow lifecycle with phases
- Task plan template
- Quick reference commands and key file locations
- Rules of engagement

## Security Settings

The configuration applies hardened permission rules to Claude Code.

### Auto-Approved (Allow List)

Safe, everyday operations that run without prompting:

- **File reading**: Read, Glob, Grep
- **Git (safe)**: status, diff, log, branch, checkout, add, commit
- **Dev tools**: npm run/test/install, npx, node, tsc, eslint, prettier
- **Filesystem (non-destructive)**: ls, cat, head, tail, find, mkdir, cp, mv
- **Linear MCP**: all Linear tools

### Hard-Blocked (Deny List)

These commands are **permanently blocked** and cannot be overridden:

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
| Secret exfiltration | Reading `.env`, `.pem`, `.key`, credentials; `env`/`printenv`; `ssh`/`scp` |

## Project Structure

```
claude-code-config/
├── README.md                          # This file
├── setup.sh                           # Main setup script
├── config/
│   ├── claude-settings.json           # Claude Code settings template
│   ├── solo-system-prompt.md          # System prompt for Solo Dev mode
│   ├── team-system-prompt.md          # System prompt for Team Lead mode
│   ├── tmux.conf                      # tmux config for Team mode
│   └── iterm2-team-profile.json       # iTerm2 dynamic profile
├── plans/
│   ├── backend.md                     # Backend plan (NestJS, Prisma, GraphQL)
│   ├── app.md                         # Mobile App plan (React Native, Expo)
│   └── web.md                         # Web plan (Next.js, TailwindCSS, React Query)
├── commands/
│   └── linear.md                      # /linear slash command definition
├── examples/                          # Reference examples (not used at runtime)
│   ├── backend-team-plan.md
│   └── app-team-plan.md
└── bin/
    ├── claude-solo                     # Solo Dev launcher
    └── claude-team                     # Team Lead launcher
```

## Customization

### Modify Claude Settings

Edit `config/claude-settings.json` and re-run `./setup.sh` to merge changes. Or edit `~/.claude/settings.json` directly.

### Modify System Prompts

Edit the markdown files in `config/`:
- `solo-system-prompt.md` — controls Solo Dev behavior and plan detection
- `team-system-prompt.md` — controls Team Lead behavior and agent orchestration

Changes take effect on the next launch (no re-run of setup needed since the bin scripts reference these files directly).

### Modify Agent Roles and Standards

Edit the plan templates in `plans/` to change agent responsibilities, coding standards, checklists, or orchestration flow:
- `plans/backend.md` — Backend (NestJS) agent definitions and standards
- `plans/app.md` — Mobile App (React Native / Expo) agent definitions and standards
- `plans/web.md` — Web (Next.js) agent definitions and standards

### Add a New Project Type

1. Create a new plan file in `plans/` (e.g., `plans/python.md`)
2. Follow the same structure as existing plans (roster, orchestration, agent definitions, workflow, rules)
3. Update `config/solo-system-prompt.md` and `config/team-system-prompt.md` to include the new project type in detection

### Modify the /linear Command

Edit `commands/linear.md`, then re-run `./setup.sh` (or copy it to `~/.claude/commands/linear.md` manually).

## Troubleshooting

**"claude: command not found"** — Install Claude Code: `npm install -g @anthropic-ai/claude-code`

**"tmux: command not found"** — Install tmux: `brew install tmux`

**Linear MCP not working** — Run `/mcp` inside Claude to re-authenticate. If it fails, try:
```bash
claude mcp add-json linear '{"command":"npx","args":["-y","mcp-remote","https://mcp.linear.app/sse"]}'
```

**iTerm2 shortcut not working** — Open iTerm2, go to Settings > Profiles, verify "Claude Team" appears in the list. The profile is loaded from `~/Library/Application Support/iTerm2/DynamicProfiles/claude-team.json`.

**Teammates not appearing in team mode** — Ensure `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is set to `"1"` in `~/.claude/settings.json`. Check with: `cat ~/.claude/settings.json | grep AGENT_TEAMS`

## License

MIT
