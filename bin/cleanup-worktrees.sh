#!/usr/bin/env bash
# cleanup-worktrees.sh
#
# Walks every git repo under ~/Developer/, finds worktrees under
# .claude/worktrees/, and removes those whose branch has a merged or closed PR.
# Worktrees with uncommitted changes are skipped (logged for manual review).
# Worktrees with open PRs are kept. Worktrees with no PR are kept.
#
# Usage: cleanup-worktrees.sh [--dry-run] [--debounce SECONDS] [-v|--verbose]
#
# Always exits 0 so it's safe as a Stop hook. Errors go to the log.

set -uo pipefail

DRY_RUN=0
VERBOSE=0
DEBOUNCE=0

while (( "$#" )); do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --debounce) DEBOUNCE="${2:-0}"; shift 2 ;;
    --verbose|-v) VERBOSE=1; shift ;;
    *) shift ;;
  esac
done

LOG_FILE="${HOME}/.claude/cleanup-worktrees.log"
SENTINEL="${HOME}/.claude/.cleanup-worktrees.last"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$msg" >> "$LOG_FILE"
  [[ $VERBOSE -eq 1 ]] && echo "$msg" >&2
  return 0
}

# Debounce: skip if last successful run was within DEBOUNCE seconds.
if (( DEBOUNCE > 0 )) && [[ -f "$SENTINEL" ]]; then
  last_run=$(stat -f %m "$SENTINEL" 2>/dev/null || stat -c %Y "$SENTINEL" 2>/dev/null || echo 0)
  now=$(date +%s)
  if (( now - last_run < DEBOUNCE )); then
    log "Debounced (last run $((now - last_run))s ago, threshold ${DEBOUNCE}s)"
    exit 0
  fi
fi

if ! command -v gh >/dev/null 2>&1; then
  log "ERROR: gh CLI not available — cannot determine PR state"
  exit 0
fi

REMOVED=0
KEPT_OPEN=0
KEPT_NO_PR=0
SKIPPED_DIRTY=0
ERRORS=0

remove_worktree() {
  local repo="$1" wt_path="$2" wt_branch="$3" reason="$4"

  if [[ -d "$wt_path" ]]; then
    local dirty
    dirty=$(git -C "$wt_path" status --porcelain 2>/dev/null || echo "")
    if [[ -n "$dirty" ]]; then
      log "  $wt_path ($wt_branch): PR $reason but uncommitted changes — skipping"
      SKIPPED_DIRTY=$((SKIPPED_DIRTY+1))
      return
    fi
  fi

  if (( DRY_RUN == 1 )); then
    log "  $wt_path ($wt_branch): WOULD remove (PR $reason)"
    REMOVED=$((REMOVED+1))
    return
  fi

  if git -C "$repo" worktree remove --force "$wt_path" 2>>"$LOG_FILE"; then
    log "  $wt_path ($wt_branch): removed (PR $reason)"
    git -C "$repo" branch -D "$wt_branch" >>"$LOG_FILE" 2>&1 || true
    REMOVED=$((REMOVED+1))
  else
    log "  $wt_path ($wt_branch): worktree remove failed"
    ERRORS=$((ERRORS+1))
  fi
}

process_worktree() {
  local repo="$1" wt_path="$2" wt_branch="$3"

  case "$wt_path" in
    "$repo/.claude/worktrees/"*) ;;
    *) return ;;
  esac

  if [[ -z "$wt_branch" ]]; then
    log "  $wt_path: detached HEAD — skipping"
    return
  fi

  local pr_state
  pr_state=$( (cd "$repo" && gh pr list --head "$wt_branch" --state all --json state --jq '.[0].state // "NONE"') 2>/dev/null || echo "ERROR")

  case "$pr_state" in
    MERGED|CLOSED)
      remove_worktree "$repo" "$wt_path" "$wt_branch" "$pr_state"
      ;;
    OPEN)
      log "  $wt_path ($wt_branch): PR open — keeping"
      KEPT_OPEN=$((KEPT_OPEN+1))
      ;;
    NONE)
      log "  $wt_path ($wt_branch): no PR — keeping"
      KEPT_NO_PR=$((KEPT_NO_PR+1))
      ;;
    *)
      log "  $wt_path ($wt_branch): error querying PR state ($pr_state)"
      ERRORS=$((ERRORS+1))
      ;;
  esac
}

cleanup_repo() {
  local repo="$1"
  log "Scanning $repo"

  local wt_path="" wt_branch=""
  # `git worktree list --porcelain` emits blocks separated by blank lines.
  # Append a trailing newline so the final block flushes through the loop.
  while IFS= read -r line; do
    if [[ -z "$line" ]]; then
      [[ -n "$wt_path" ]] && process_worktree "$repo" "$wt_path" "$wt_branch"
      wt_path=""; wt_branch=""
      continue
    fi
    case "$line" in
      "worktree "*) wt_path="${line#worktree }" ;;
      "branch refs/heads/"*) wt_branch="${line#branch refs/heads/}" ;;
    esac
  done < <(git -C "$repo" worktree list --porcelain; printf '\n')

  if (( DRY_RUN == 0 )); then
    git -C "$repo" worktree prune 2>>"$LOG_FILE" || true
  fi
}

log "=== cleanup-worktrees start (dry_run=$DRY_RUN debounce=$DEBOUNCE) ==="

for repo in "${HOME}/Developer"/*; do
  [[ -d "$repo/.git" ]] || continue
  [[ -d "$repo/.claude/worktrees" ]] || continue
  cleanup_repo "$repo"
done

log "=== cleanup-worktrees done: removed=$REMOVED open=$KEPT_OPEN no_pr=$KEPT_NO_PR dirty=$SKIPPED_DIRTY errors=$ERRORS ==="

touch "$SENTINEL" 2>/dev/null || true

echo "Worktree cleanup: removed=$REMOVED kept_open=$KEPT_OPEN kept_no_pr=$KEPT_NO_PR dirty_skipped=$SKIPPED_DIRTY errors=$ERRORS"
exit 0
