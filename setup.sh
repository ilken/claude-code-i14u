#!/usr/bin/env bash
# setup.sh — One-command setup for Claude Code with Solo & Team modes
#
# What this script does:
#   1. Installs Homebrew (if missing)
#   2. Installs iTerm2 and tmux via Homebrew
#   3. Checks for Claude Code (prompts to install if missing)
#   4. Merges Claude Code settings into ~/.claude/settings.json
#   5. Adds the Linear MCP server
#   6. Installs the /linear custom slash command
#   7. Installs tmux config optimized for Claude Team mode
#   8. Installs the iTerm2 "Claude Team" dynamic profile (Ctrl+Cmd+L)
#   9. Symlinks claude-solo, claude-team, and claude-lead to /usr/local/bin
#  10. (reserved)
#  11. Symlinks CLAUDE.md orchestrator to ~/Documents/GitHub/
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
NC='\033[0m' # No Color

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
echo -e "${BOLD}║     Claude Code Config — Setup Script            ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: Homebrew ─────────────────────────────────────────────────────────

info "Checking for Homebrew..."
if command -v brew &>/dev/null; then
  success "Homebrew is already installed."
else
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  success "Homebrew installed."
fi

# ─── Step 2: iTerm2 ──────────────────────────────────────────────────────────

info "Checking for iTerm2..."
if brew list --cask iterm2 &>/dev/null 2>&1 || [[ -d "/Applications/iTerm.app" ]]; then
  success "iTerm2 is already installed."
else
  info "Installing iTerm2..."
  brew install --cask iterm2
  success "iTerm2 installed."
fi

# ─── Step 3: tmux ────────────────────────────────────────────────────────────

info "Checking for tmux..."
if command -v tmux &>/dev/null; then
  success "tmux is already installed."
else
  info "Installing tmux..."
  brew install tmux
  success "tmux installed."
fi

# ─── Step 4: Claude Code ─────────────────────────────────────────────────────

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

# ─── Step 5: Claude Code settings ────────────────────────────────────────────

info "Configuring Claude Code settings..."

CLAUDE_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"

mkdir -p "$CLAUDE_DIR"

if [[ -f "$CLAUDE_SETTINGS" ]]; then
  info "Existing settings found. Merging..."
  # Use a temp file to merge settings with jq if available, otherwise replace
  if command -v jq &>/dev/null; then
    # Deep merge: existing settings + our settings (ours take precedence for new keys,
    # arrays are concatenated and deduplicated)
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
    warn "jq not found — installing jq for settings merge..."
    brew install jq
    jq -s '
      def dedup: unique;
      .[0] as $existing | .[1] as $new |
      ($existing // {}) * ($new // {}) |
      .permissions.allow = (($existing.permissions.allow // []) + ($new.permissions.allow // []) | dedup) |
      .permissions.deny = (($existing.permissions.deny // []) + ($new.permissions.deny // []) | dedup)
    ' "$CLAUDE_SETTINGS" "$SCRIPT_DIR/config/claude-settings.json" > "${CLAUDE_SETTINGS}.tmp"
    mv "${CLAUDE_SETTINGS}.tmp" "$CLAUDE_SETTINGS"
    success "Settings merged (existing settings preserved)."
  fi
else
  cp "$SCRIPT_DIR/config/claude-settings.json" "$CLAUDE_SETTINGS"
  success "Settings installed."
fi

# ─── Step 6: Linear MCP server ───────────────────────────────────────────────

info "Configuring Linear MCP server..."
if command -v claude &>/dev/null; then
  # Add the Linear MCP server (idempotent — overwrites if exists)
  claude mcp add-json linear '{"command":"npx","args":["-y","mcp-remote","https://mcp.linear.app/sse"]}' 2>/dev/null || true
  success "Linear MCP server configured."
  echo -e "  ${YELLOW}Note:${NC} On first use, run ${BOLD}/mcp${NC} inside Claude to authenticate with Linear."
else
  warn "Claude Code not installed — skipping Linear MCP setup."
  echo "  Run this after installing Claude Code:"
  echo "  claude mcp add-json linear '{\"command\":\"npx\",\"args\":[\"-y\",\"mcp-remote\",\"https://mcp.linear.app/sse\"]}'"
fi

# ─── Step 6b: Context7 MCP server ─────────────────────────────────────────────

info "Configuring Context7 MCP server..."
if command -v claude &>/dev/null; then
  claude mcp add-json context7 '{"command":"npx","args":["-y","@upstash/context7-mcp"]}' 2>/dev/null || true
  success "Context7 MCP server configured."
else
  warn "Claude Code not installed — skipping Context7 MCP setup."
  echo "  Run this after installing Claude Code:"
  echo "  claude mcp add-json context7 '{\"command\":\"npx\",\"args\":[\"-y\",\"@upstash/context7-mcp\"]}'"
fi

# ─── Step 7: Custom /linear slash command ─────────────────────────────────────

info "Installing /linear slash command..."

CLAUDE_COMMANDS_DIR="$CLAUDE_DIR/commands"
mkdir -p "$CLAUDE_COMMANDS_DIR"
cp "$SCRIPT_DIR/commands/linear.md" "$CLAUDE_COMMANDS_DIR/linear.md"
success "/linear command installed to $CLAUDE_COMMANDS_DIR/linear.md"

# ─── Step 8: tmux config ──────────────────────────────────────────────────────

info "Installing tmux config for Claude Team mode..."

TMUX_CONF="$HOME/.tmux.conf"

if [[ -f "$TMUX_CONF" ]]; then
  # Check if our config is already present
  if grep -q "Claude Code Team Mode" "$TMUX_CONF" 2>/dev/null; then
    success "tmux config already installed."
  else
    info "Existing ~/.tmux.conf found. Appending Claude settings..."
    echo "" >> "$TMUX_CONF"
    echo "# ─── Added by claude-code-config setup ─────────────────────────────────" >> "$TMUX_CONF"
    cat "$SCRIPT_DIR/config/tmux.conf" >> "$TMUX_CONF"
    success "tmux settings appended to existing ~/.tmux.conf"
  fi
else
  cp "$SCRIPT_DIR/config/tmux.conf" "$TMUX_CONF"
  success "tmux config installed to ~/.tmux.conf"
fi

# ─── Step 9: iTerm2 dynamic profile ──────────────────────────────────────────

info "Installing iTerm2 'Claude Team' profile..."

ITERM_DYNAMIC_DIR="$HOME/Library/Application Support/iTerm2/DynamicProfiles"
mkdir -p "$ITERM_DYNAMIC_DIR"
cp "$SCRIPT_DIR/config/iterm2-team-profile.json" "$ITERM_DYNAMIC_DIR/claude-team.json"
success "iTerm2 profile installed. Shortcut: Ctrl+Cmd+L"

# ─── Step 10: Symlink bin scripts ────────────────────────────────────────────

info "Installing claude-solo, claude-team, and claude-lead commands..."

BIN_TARGET="/usr/local/bin"

if [[ ! -d "$BIN_TARGET" ]]; then
  sudo mkdir -p "$BIN_TARGET"
fi

# Remove old symlinks if they exist
[[ -L "$BIN_TARGET/claude-solo" ]] && sudo rm "$BIN_TARGET/claude-solo"
[[ -L "$BIN_TARGET/claude-team" ]] && sudo rm "$BIN_TARGET/claude-team"
[[ -L "$BIN_TARGET/claude-lead" ]] && sudo rm "$BIN_TARGET/claude-lead"

sudo ln -sf "$SCRIPT_DIR/bin/claude-solo" "$BIN_TARGET/claude-solo"
sudo ln -sf "$SCRIPT_DIR/bin/claude-team" "$BIN_TARGET/claude-team"
sudo ln -sf "$SCRIPT_DIR/bin/claude-lead" "$BIN_TARGET/claude-lead"
success "Commands installed:"
echo "    claude-solo  → Solo Dev Mode"
echo "    claude-team  → Team Lead Mode"
echo "    claude-lead  → Project Lead Mode"

# ─── Step 11: Deploy orchestrator CLAUDE.md ──────────────────────────────────

info "Deploying orchestrator CLAUDE.md..."

GITHUB_DIR="$HOME/Documents/GitHub"
ORCHESTRATOR_SOURCE="$SCRIPT_DIR/CLAUDE.md"
ORCHESTRATOR_TARGET="$GITHUB_DIR/CLAUDE.md"

if [[ -f "$ORCHESTRATOR_SOURCE" ]]; then
  ln -sf "$ORCHESTRATOR_SOURCE" "$ORCHESTRATOR_TARGET"
  success "CLAUDE.md symlinked: $ORCHESTRATOR_TARGET → $ORCHESTRATOR_SOURCE"
else
  warn "CLAUDE.md not found at $ORCHESTRATOR_SOURCE — skipping symlink."
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║               Setup Complete!                     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Usage:${NC}"
echo ""
echo -e "  ${GREEN}claude-solo${NC}            Start Claude in Solo Dev mode"
echo -e "  ${GREEN}claude-team${NC}            Start Claude in Team Lead mode"
echo -e "  ${GREEN}claude-lead${NC}            Start Claude in Project Lead mode"
echo -e "  ${GREEN}Ctrl+Cmd+L${NC}             Open iTerm2 Claude Team window"
echo -e "  ${GREEN}/linear TICKET${NC}         Read a Linear ticket and plan (inside Claude)"
echo ""
echo -e "  ${BOLD}First-time Linear setup:${NC}"
echo -e "  1. Open Claude: ${GREEN}claude-solo${NC}"
echo -e "  2. Run ${GREEN}/mcp${NC} to authenticate with Linear"
echo -e "  3. Then use ${GREEN}/linear LIN-123${NC} to read any ticket"
echo ""
