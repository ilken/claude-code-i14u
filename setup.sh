#!/usr/bin/env bash
# setup.sh — One-command setup for Claude Code with Solo & Team modes
#
# What this script does:
#   1.  Installs Homebrew (if missing)
#   2.  Checks for Claude Code (prompts to install if missing)
#   3.  Merges Claude Code settings into ~/.claude/settings.json
#   4.  Installs global npm tools: uipro-cli, playwright
#   5.  Configures Context7 MCP server
#   6.  Configures Shadcn MCP server
#   7.  Configures Iconify MCP server
#   8.  Configures 21st.dev MCP server (prompts for API key)
#   9.  Sets up iTerm2 profiles for claude-solo and claude-team
#  10.  Symlinks claude-solo, claude-team, and claude-lead to /usr/local/bin
#  11.  Symlinks CLAUDE.md orchestrator to ~/.claude/CLAUDE.md
#  12.  Installs global commands (startup:, project:) to ~/.claude/commands/
#  13.  Symlinks native skills to ~/.claude/skills/
#  14.  Symlinks team agents to ~/.claude/agents/
#
# Usage:
#   chmod +x setup.sh && ./setup.sh

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Pre-flight checks ───────────────────────────────────────────────────────

if [[ "$(uname)" != "Darwin" ]]; then
  error "This script is designed for macOS only."
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     Claude Code i14u — Setup Script              ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: Homebrew ────────────────────────────────────────────────────────

info "Checking for Homebrew..."
if command -v brew &>/dev/null; then
  success "Homebrew is already installed."
else
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  success "Homebrew installed."
fi

# ─── Step 2: Claude Code ─────────────────────────────────────────────────────

info "Checking for Claude Code..."
if command -v claude &>/dev/null; then
  CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
  success "Claude Code is installed (${CLAUDE_VERSION})."
else
  warn "Claude Code is not installed."
  echo ""
  echo -e "  Install it with: ${BOLD}npm install -g @anthropic-ai/claude-code${NC}"
  echo ""
  read -p "  Would you like to install it now? (y/N) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v npm &>/dev/null; then
      npm install -g @anthropic-ai/claude-code
      success "Claude Code installed."
    else
      error "npm is not installed. Install Node.js >= 18 first: https://nodejs.org"
    fi
  else
    warn "Skipping Claude Code installation. Some setup steps will be skipped."
  fi
fi

# ─── Step 3: Claude Code settings ────────────────────────────────────────────

info "Configuring Claude Code settings..."

CLAUDE_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"

mkdir -p "$CLAUDE_DIR"

# Ensure jq is available
if ! command -v jq &>/dev/null; then
  info "Installing jq..."
  brew install jq
fi

if [[ -f "$CLAUDE_SETTINGS" ]]; then
  info "Existing settings found. Merging..."
  jq -s '
    def dedup: unique;
    .[0] as $existing | .[1] as $new |
    ($existing // {}) * ($new // {}) |
    .permissions.allow = (($existing.permissions.allow // []) + ($new.permissions.allow // []) | dedup) |
    .permissions.deny = (($existing.permissions.deny // []) + ($new.permissions.deny // []) | dedup)
  ' "$CLAUDE_SETTINGS" "$SCRIPT_DIR/config/claude-settings.json" > "${CLAUDE_SETTINGS}.tmp"
  mv "${CLAUDE_SETTINGS}.tmp" "$CLAUDE_SETTINGS"
  success "Settings merged (existing settings preserved)."
else
  cp "$SCRIPT_DIR/config/claude-settings.json" "$CLAUDE_SETTINGS"
  success "Settings installed."
fi

# ─── Step 4: Global npm tools ────────────────────────────────────────────────

info "Installing global npm tools..."

if command -v npm &>/dev/null; then
  # UI UX Pro Max CLI — keeps the design skill up to date
  if ! command -v uipro &>/dev/null; then
    npm install -g uipro-cli
    success "uipro-cli installed."
  else
    success "uipro-cli already installed."
  fi

  # Playwright — global CLI for E2E testing and UI debugging
  if ! command -v playwright &>/dev/null; then
    npm install -g playwright
    npx playwright install chromium --with-deps 2>/dev/null || true
    success "Playwright installed."
  else
    success "Playwright already installed."
  fi
else
  warn "npm not found — skipping global tool installs. Install Node.js >= 18 first."
fi

# ─── Step 5: Context7 MCP server ─────────────────────────────────────────────

info "Configuring Context7 MCP server..."
if command -v claude &>/dev/null; then
  claude mcp add-json context7 '{"command":"npx","args":["-y","@upstash/context7-mcp"]}' 2>/dev/null || true
  success "Context7 MCP configured."
else
  warn "Claude Code not installed — skipping MCP setup."
fi

# ─── Step 6: Shadcn MCP server ───────────────────────────────────────────────

info "Configuring Shadcn MCP server..."
if command -v claude &>/dev/null; then
  claude mcp add-json shadcn '{"command":"npx","args":["shadcn@latest","mcp"]}' 2>/dev/null || true
  success "Shadcn MCP configured."
fi

# ─── Step 7: Iconify MCP server ──────────────────────────────────────────────

info "Configuring Iconify MCP server..."
if command -v claude &>/dev/null; then
  claude mcp add-json iconify '{"command":"npx","args":["-y","@osmansiddiquer/iconify-mcp"]}' 2>/dev/null || true
  success "Iconify MCP configured."
fi

# ─── Step 8: 21st.dev MCP server ─────────────────────────────────────────────

info "Configuring 21st.dev MCP server (UI component inspiration)..."
echo ""
echo -e "  ${YELLOW}21st.dev requires an API key.${NC}"
echo -e "  Get yours at: https://21st.dev"
echo ""
read -p "  Enter your 21st.dev API key (leave blank to skip): " TWENTYFIRST_KEY
echo ""
if [[ -n "$TWENTYFIRST_KEY" ]] && command -v claude &>/dev/null; then
  claude mcp add-json 21st-dev \
    "{\"command\":\"npx\",\"args\":[\"-y\",\"@21st-dev/mcp@latest\"],\"env\":{\"API_KEY\":\"${TWENTYFIRST_KEY}\"}}" \
    2>/dev/null || true
  success "21st.dev MCP configured."
  echo -e "  ${YELLOW}Note:${NC} API key is stored in your Claude MCP config, not in this repo."
elif [[ -z "$TWENTYFIRST_KEY" ]]; then
  warn "Skipping 21st.dev MCP — no API key provided."
  echo "  To add later: claude mcp add-json 21st-dev '{\"command\":\"npx\",\"args\":[\"-y\",\"@21st-dev/mcp@latest\"],\"env\":{\"API_KEY\":\"YOUR_KEY\"}}'"
fi

# ─── Step 9: iTerm2 profile setup ────────────────────────────────────────────

info "Setting up iTerm2 profiles..."

ITERM_PREFS_DIR="$HOME/Library/Application Support/iTerm2/DynamicProfiles"

if [[ -d "/Applications/iTerm.app" ]] || [[ -d "/Applications/iTerm2.app" ]]; then
  mkdir -p "$ITERM_PREFS_DIR"
  cp "$SCRIPT_DIR/config/iterm2-profiles.json" "$ITERM_PREFS_DIR/claude-code-profiles.json"
  success "iTerm2 profiles installed (claude-solo + claude-team)."
  echo ""
  echo -e "  Profiles available in iTerm2 > Profiles:"
  echo -e "    ${GREEN}Claude Solo${NC}   — Solo Dev mode"
  echo -e "    ${GREEN}Claude Team${NC}   — Team Lead mode (multi-agent)"
  echo -e "  Hotkeys:"
  echo -e "    ${GREEN}Ctrl+Cmd+S${NC}    Open Claude Solo window"
  echo -e "    ${GREEN}Ctrl+Cmd+T${NC}    Open Claude Team window"
  echo ""
else
  warn "iTerm2 not found at /Applications/iTerm.app — skipping profile install."
  echo "  Install iTerm2 from https://iterm2.com, then re-run setup.sh"
fi

# ─── Step 10: Symlink bin scripts ────────────────────────────────────────────

info "Installing claude-solo, claude-team, and claude-lead commands..."

BIN_TARGET="/usr/local/bin"

if [[ ! -d "$BIN_TARGET" ]]; then
  sudo mkdir -p "$BIN_TARGET"
fi

[[ -L "$BIN_TARGET/claude-solo" ]] && sudo rm "$BIN_TARGET/claude-solo"
[[ -L "$BIN_TARGET/claude-team" ]] && sudo rm "$BIN_TARGET/claude-team"
[[ -L "$BIN_TARGET/claude-lead" ]] && sudo rm "$BIN_TARGET/claude-lead"

sudo ln -sf "$SCRIPT_DIR/bin/claude-solo" "$BIN_TARGET/claude-solo"
sudo ln -sf "$SCRIPT_DIR/bin/claude-team" "$BIN_TARGET/claude-team"
sudo ln -sf "$SCRIPT_DIR/bin/claude-lead" "$BIN_TARGET/claude-lead"
success "Commands installed: claude-solo, claude-team, claude-lead"

# ─── Step 11: Deploy orchestrator CLAUDE.md ──────────────────────────────────

info "Deploying orchestrator CLAUDE.md..."

ORCHESTRATOR_SOURCE="$SCRIPT_DIR/CLAUDE.md"
GLOBAL_TARGET="$HOME/.claude/CLAUDE.md"

if [[ -f "$ORCHESTRATOR_SOURCE" ]]; then
  ln -sf "$ORCHESTRATOR_SOURCE" "$GLOBAL_TARGET"
  success "CLAUDE.md symlinked: $GLOBAL_TARGET → $ORCHESTRATOR_SOURCE"
else
  warn "CLAUDE.md not found at $ORCHESTRATOR_SOURCE — skipping."
fi

# ─── Step 12: Install global commands ───────────────────────────────────────

info "Installing global Claude commands (~/.claude/commands/)..."

GLOBAL_COMMANDS_DIR="$HOME/.claude/commands"
LOCAL_COMMANDS_DIR="$SCRIPT_DIR/.claude/commands"

mkdir -p "$GLOBAL_COMMANDS_DIR"

# Copy each subdirectory (namespaced commands like startup:, project:)
for dir in "$LOCAL_COMMANDS_DIR"/*/; do
  namespace=$(basename "$dir")
  mkdir -p "$GLOBAL_COMMANDS_DIR/$namespace"
  cp "$dir"*.md "$GLOBAL_COMMANDS_DIR/$namespace/" 2>/dev/null || true
  success "Commands installed: $namespace:"
done

# Copy any top-level .md command files
for file in "$LOCAL_COMMANDS_DIR"/*.md; do
  [[ -f "$file" ]] || continue
  cp "$file" "$GLOBAL_COMMANDS_DIR/"
  success "Command installed: $(basename "$file")"
done

# ─── Step 13: Install native skills ──────────────────────────────────────────

info "Installing native skills (~/.claude/skills/)..."

SKILLS_TARGET="$HOME/.claude/skills"
mkdir -p "$SKILLS_TARGET"

# skill-name:repo-dir pairs — each repo dir contains a SKILL.md
for pair in \
  "dev-workflow:dev-workflow" \
  "debug-mode:debug-mode" \
  "new-project-setup:new-project-setup" \
  "web-ui-design:web-ui-design" \
  "app-dev:app" \
  "backend-dev:backend" \
  "web-dev:web" \
  "ui-ux-pro-max:ui-ux-pro-max"; do
  name="${pair%%:*}"
  dir="${pair##*:}"
  ln -sfn "$SCRIPT_DIR/skills/$dir" "$SKILLS_TARGET/$name"
  success "Skill installed: $name"
done

# ─── Step 14: Install team agents ────────────────────────────────────────────

info "Installing team agents (~/.claude/agents/)..."

AGENTS_TARGET="$HOME/.claude/agents"
mkdir -p "$AGENTS_TARGET"

for agent in "$SCRIPT_DIR"/agents/*.md; do
  [[ -f "$agent" ]] || continue
  ln -sf "$agent" "$AGENTS_TARGET/$(basename "$agent")"
  success "Agent installed: $(basename "$agent" .md)"
done

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║               Setup Complete!                     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Usage:${NC}"
echo ""
echo -e "  ${GREEN}claude-solo${NC}            Start Claude in Solo Dev mode"
echo -e "  ${GREEN}claude-team${NC}            Start Claude in Team Lead mode (multi-agent)"
echo -e "  ${GREEN}claude-lead${NC}            Start Claude in Project Lead mode"
echo -e "  ${GREEN}Ctrl+Cmd+S${NC}             Open iTerm2 Claude Solo window"
echo -e "  ${GREEN}Ctrl+Cmd+T${NC}             Open iTerm2 Claude Team window"
echo ""
echo -e "  ${BOLD}Design System:${NC}"
echo -e "  Run ${GREEN}uipro init --ai claude${NC} in any project to install/update the UI skill"
echo -e "  Templates for BRAND-VOICE, DESIGN-TOKENS, MOTION-SPEC in skills/web-ui-design/templates/"
echo ""
