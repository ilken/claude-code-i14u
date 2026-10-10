#!/usr/bin/env bash
# PreToolUse (Bash) hook: block `git commit` when the TARGET repo is on main/master.
#
# Reads the hook payload JSON from stdin and decides from the command string
# itself — no `if` filter in settings.json, because permission-rule prefix
# matching is conservative on compound commands (loops, $(), heredocs) and
# either over-fires or silently skips them. This script exits 0 for anything
# that is not a real `git commit`, so it can safely run on every Bash call.
#
# Target resolution: every `git -C <dir> commit` is checked against <dir>;
# a bare `git commit` is checked against the hook's cwd. Exit 2 blocks.

set -u

payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$cmd" ] && exit 0

case "$cmd" in
  *git*commit*) ;;
  *) exit 0 ;;
esac

cwd=$(printf '%s' "$payload" | jq -r '.cwd // empty' 2>/dev/null)
[ -z "$cwd" ] && cwd=$PWD

dirs=$(printf '%s\n' "$cmd" \
  | grep -oE 'git[[:space:]]+-C[[:space:]]+[^[:space:]]+[[:space:]]+commit([[:space:]]|$)' \
  | awk '{print $3}' | tr -d '"' | tr -d "'")

if printf '%s' "$cmd" | grep -qE '(^|[;&|(:[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  dirs=$(printf '%s\n%s' "$dirs" "$cwd")
fi

[ -z "$(printf '%s' "$dirs" | tr -d '[:space:]')" ] && exit 0

for d in $dirs; do
  branch=$(git -C "$d" branch --show-current 2>/dev/null) || continue
  if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
    echo "BLOCKED: refusing 'git commit' on '$branch' in $d. Create a feature branch first: git -C $d checkout -b <user>/<slug>" >&2
    exit 2
  fi
done

exit 0
