#!/usr/bin/env bash
# pr-check.sh: keep comments and PR bodies short.
#
# Enforces the limits in skills/dev-workflow/code-comments.md (a comment is one line,
# two at the absolute most) and skills/dev-workflow/pr-workflow.md (the body is
# bullets, not paragraphs). Comments are read from the branch diff, so only
# lines this branch added are judged.
#
# Usage:
#   bin/pr-check.sh                      # comments in <base>...HEAD
#   bin/pr-check.sh --body FILE          # also check a drafted PR body (- = stdin)
#   bin/pr-check.sh --staged             # comments in the staged diff
#   bin/pr-check.sh --diff FILE          # comments in a unified diff (- = stdin)
#   bin/pr-check.sh --base develop       # default: main
#   bin/pr-check.sh --repo <dir>         # default: cwd
#   bin/pr-check.sh --hook               # PreToolUse(Bash) gate on `gh pr create`
#
# Caps (override by env):
#   PR_CHECK_COMMENT_CHARS=100   chars of comment text on one line, URLs excluded
#   PR_CHECK_COMMENT_LINES=2     consecutive comment lines in one block
#   PR_CHECK_BODY_CHARS=140      chars on one body line
#   PR_CHECK_BODY_PARA=2         consecutive prose lines in one paragraph
#   PR_CHECK_BODY_LINES=35       lines in the whole body
#   PR_CHECK_OFF=1               skip every check (the user's escape hatch, not Claude's)
#
# Hook mode reads a `--body-file` and a heredoc body. An inline `--body "..."`
# string is not extracted, and then only the comments are checked.
#
# Exit: 0 = clean, 1 = violations (2 in hook mode, which blocks the call), 2 = usage error.
#
# Compatible with macOS bash 3.2.

set -uo pipefail

CAP_COMMENT_CHARS="${PR_CHECK_COMMENT_CHARS:-100}"
CAP_COMMENT_LINES="${PR_CHECK_COMMENT_LINES:-2}"
CAP_BODY_CHARS="${PR_CHECK_BODY_CHARS:-140}"
CAP_BODY_PARA="${PR_CHECK_BODY_PARA:-2}"
CAP_BODY_LINES="${PR_CHECK_BODY_LINES:-35}"

BASE="main"
REPO="$PWD"
BODY_FILE=""
DIFF_FILE=""
MODE="range"
HOOK=0

while [ $# -gt 0 ]; do
  case "$1" in
    --hook)    HOOK=1 ;;
    --staged)  MODE="staged" ;;
    --base)    BASE="${2:-}"; shift ;;
    --repo)    REPO="${2:-}"; shift ;;
    --body)    BODY_FILE="${2:-}"; shift ;;
    --diff)    DIFF_FILE="${2:-}"; MODE="diff"; shift ;;
    -h|--help) sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         echo "pr-check: unknown argument '$1'" >&2; exit 2 ;;
  esac
  shift
done

[ "${PR_CHECK_OFF:-0}" = "1" ] && exit 0

# Validated here, not in run_checks: that runs in a subshell and its exit is lost.
for f in "$DIFF_FILE" "$BODY_FILE"; do
  [ -z "$f" ] || [ "$f" = "-" ] || [ -r "$f" ] && continue
  echo "pr-check: cannot read '$f'" >&2
  exit 2
done

# --- Comments in a diff -----------------------------------------------------
# Reads a unified diff on stdin, prints one line per violation.
scan_comments() {
  awk -v cap_chars="$CAP_COMMENT_CHARS" -v cap_block="$CAP_COMMENT_LINES" '
    function report_run() {
      # A run starting at the top of a file is a header (usage, licence, module doc), not a paragraph.
      if (run_len > cap_block && run_block_ok && run_start > 5)
        printf "  comment block  %s:%d  %d lines (cap %d)  %s\n", run_file, run_start, run_len, cap_block, run_text
      run_len = 0
    }
    function kind_of(path,   ext, base) {
      base = path; sub(/.*\//, "", base)
      ext = tolower(path)
      if (ext !~ /\./) ext = ""; else sub(/.*\./, "", ext)
      if (ext ~ /^(ts|tsx|js|jsx|mjs|cjs|mts|cts|java|kt|kts|swift|go|c|h|cc|cpp|hpp|cs|scss|less|php|rs|dart|prisma|proto|gradle)$/) return "slash"
      if (ext ~ /^(py|sh|bash|zsh|rb|yml|yaml|tf|tfvars|hcl|toml|gql|graphql|pl)$/) return "hash"
      if (ext == "sql") return "dash"
      if (base ~ /^(Dockerfile|Makefile)$/) return "hash"
      return ""
    }
    /^\+\+\+ /{
      report_run()
      path = substr($0, 7)
      kind = (path == "/dev/null") ? "" : kind_of(path)
      if (path ~ /(^|\/)(node_modules|dist|build|coverage|vendor|__generated__|generated|\.yarn)\// || path ~ /\.generated\./) kind = ""
      file = path
      block_ok = (path !~ /migrations\//)
      in_block = 0
      next
    }
    /^@@/{
      report_run()
      if (match($0, /\+[0-9]+/)) lineno = substr($0, RSTART + 1, RLENGTH - 1) + 0
      in_block = 0
      next
    }
    kind == "" { next }
    /^-/ { next }
    {
      is_add = (substr($0, 1, 1) == "+")
      content = substr($0, 2)
      t = content
      sub(/^[ \t]+/, "", t)
      ctext = ""
      is_comment = 0

      if (kind == "slash") {
        if (t ~ /^\/\//)                     { is_comment = 1; ctext = substr(t, 3) }
        else if (t ~ /^\/\*/)                { is_comment = 1; ctext = t; in_block = 1 }
        else if (in_block && t ~ /^\*/)      { is_comment = 1; ctext = t }
        else if (match(content, /[^:]\/\//)) { is_comment = 1; ctext = substr(content, RSTART + 3) }
        if (t ~ /\*\//) in_block = 0
      } else if (kind == "hash") {
        if (t ~ /^#/ && t !~ /^#!/)          { is_comment = 1; ctext = substr(t, 2) }
      } else if (kind == "dash") {
        if (t ~ /^--/)                       { is_comment = 1; ctext = substr(t, 3) }
      }

      if (!is_add) { report_run(); lineno++; next }

      # A bare marker keeps the block together; a directive is not prose.
      if (!is_comment || ctext ~ /(eslint|prettier|biome|stylelint|oxlint|ts-ignore|ts-expect-error|ts-nocheck|istanbul|c8 ignore|noinspection|codegen|@generated|<reference)/) {
        report_run(); lineno++; next
      }

      clean = ctext
      gsub(/https?:\/\/[^ ]+/, "", clean)
      gsub(/^[ \t*\/]+|[ \t*\/]+$/, "", clean)
      if (length(clean) > cap_chars)
        printf "  long comment   %s:%d  %d chars (cap %d)  %.60s...\n", file, lineno, length(clean), cap_chars, clean

      if (run_len > 0 && lineno == run_prev + 1) {
        run_len++
        if (run_text == "") run_text = substr(clean, 1, 40)
      } else {
        report_run()
        run_len = 1; run_start = lineno; run_file = file; run_block_ok = block_ok
        run_text = substr(clean, 1, 40)
      }
      run_prev = lineno
      lineno++
    }
    END { report_run() }
  '
}

# --- A drafted PR body ------------------------------------------------------
scan_body() {
  awk -v cap_chars="$CAP_BODY_CHARS" -v cap_para="$CAP_BODY_PARA" -v cap_lines="$CAP_BODY_LINES" '
    function report_para() {
      if (para_len > cap_para)
        printf "  long paragraph body:%d  %d prose lines (cap %d)  break it into bullets\n", para_start, para_len, cap_para
      para_len = 0
    }
    /^[ \t]*```/ { fence = !fence; next }
    fence { next }
    {
      total++
      clean = $0
      gsub(/https?:\/\/[^ ]+/, "", clean)
      gsub(/^[ \t]*([-*+]|[0-9]+\.)[ \t]*(\[[ xX]\][ \t]*)?/, "", clean)
      if (length(clean) > cap_chars)
        printf "  long line      body:%d  %d chars (cap %d)  %.60s...\n", NR, length(clean), cap_chars, clean

      is_prose = ($0 !~ /^[ \t]*$/ && $0 !~ /^[ \t]*([-*+]|[0-9]+\.|#|\||>)/ && $0 !~ /^Resolves:/)
      if (is_prose) { if (para_len == 0) para_start = NR; para_len++ }
      else report_para()
    }
    END {
      report_para()
      if (total > cap_lines)
        printf "  long body      body  %d lines (cap %d)  cut it to the decision and the changes\n", total, cap_lines
    }
  '
}

run_checks() {
  local out="" diff_out="" range body body_out
  if [ "$MODE" = "diff" ]; then
    diff_out="$(cat "$DIFF_FILE")"
  elif [ "$MODE" = "staged" ]; then
    diff_out="$(git -C "$REPO" diff --staged -U0 2>/dev/null)"
  else
    range="$BASE"
    git -C "$REPO" rev-parse --verify --quiet "origin/$BASE" >/dev/null 2>&1 && range="origin/$BASE"
    diff_out="$(git -C "$REPO" diff -U0 "$range...HEAD" 2>/dev/null)"
  fi
  [ -n "$diff_out" ] && out="$(printf '%s\n' "$diff_out" | scan_comments)"

  if [ -n "$BODY_FILE" ]; then
    body="$(cat "$BODY_FILE")"
    body_out="$(printf '%s\n' "$body" | scan_body)"
    if [ -n "$body_out" ]; then
      [ -n "$out" ] && out="$out
$body_out" || out="$body_out"
    fi
  fi
  printf '%s' "$out"
}

# --- Hook mode --------------------------------------------------------------
if [ "$HOOK" -eq 1 ]; then
  payload="$(cat)"
  cmd="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)"
  [ -z "$cmd" ] && exit 0
  printf '%s' "$cmd" | grep -qE '(^|[;&|(]|[[:space:]])gh[[:space:]]+pr[[:space:]]+create([[:space:]]|$)' || exit 0

  cwd="$(printf '%s' "$payload" | jq -r '.cwd // empty' 2>/dev/null)"
  [ -n "$cwd" ] && REPO="$cwd"
  base_arg="$(printf '%s' "$cmd" | grep -oE '\-\-base[= ]+[^ ]+' | head -1 | sed 's/--base[= ]*//' | tr -d "\"'")"
  [ -n "$base_arg" ] && BASE="$base_arg"

  tmp_body="$(mktemp -t pr-check.XXXXXX)"
  trap 'rm -f "$tmp_body"' EXIT
  body_arg="$(printf '%s' "$cmd" | grep -oE '(\-\-body-file|\-F)[= ]+[^ ]+' | head -1 | sed -E 's/(--body-file|-F)[= ]*//' | tr -d "\"'")"
  marker="$(printf '%s' "$cmd" | grep -oE "<<-?'?[A-Za-z_][A-Za-z0-9_]*'?" | head -1 | sed -E "s/^<<-?//" | tr -d "'")"
  if [ -n "$body_arg" ] && [ -f "$body_arg" ]; then
    cat "$body_arg" > "$tmp_body"
  elif [ -n "$marker" ]; then
    printf '%s\n' "$cmd" | awk -v m="$marker" '
      f && $0 ~ "^" m "[)\"'"'"']*$" { f = 0; next }
      f { print }
      $0 ~ "<<-?'"'"'?" m "'"'"'?$" { f = 1 }
    ' > "$tmp_body"
  fi
  [ -s "$tmp_body" ] && BODY_FILE="$tmp_body"

  findings="$(run_checks)"
  [ -z "$findings" ] && exit 0

  {
    echo "BLOCKED: this PR is too wordy. Fix these, then run \`gh pr create\` again."
    echo "$findings"
    echo "Comments: one line, two at the absolute most, and only when deleting it would let someone make a wrong decision (skills/dev-workflow/code-comments.md)."
    echo "PR body: one bullet per point, no paragraphs (skills/dev-workflow/pr-workflow.md)."
    echo "Do not set PR_CHECK_OFF to get past this."
  } >&2
  exit 2
fi

# --- CLI mode ---------------------------------------------------------------
findings="$(run_checks)"
if [ -z "$findings" ]; then
  echo "pr-check: clean"
  exit 0
fi
echo "$findings"
echo ""
echo "rules: skills/dev-workflow/code-comments.md (comments), skills/dev-workflow/pr-workflow.md (body)"
exit 1
