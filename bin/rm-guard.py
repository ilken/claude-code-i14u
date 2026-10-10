#!/usr/bin/env python3
"""PreToolUse Bash hook: deny rm -rf unless every target, after any cd, is in .claude/worktrees/<name>/."""
import json
import os
import re
import shlex
import sys

INSIDE_WORKTREE = re.compile(r"/\.claude/worktrees/[^/]+/.")
GLOB = re.compile(r"[*?\[{]")


def deny(reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": f"{reason}. rm -rf is only allowed inside .claude/worktrees/<name>/",
    }}))
    sys.exit(0)


def segments(command):
    lexer = shlex.shlex(command.replace("\n", " ; "), posix=True, punctuation_chars=True)
    lexer.whitespace_split = True
    words = []
    for token in lexer:
        if token and set(token) <= set(";&|()"):
            yield words
            words = []
        else:
            words.append(token)
    yield words


def resolve(cwd, path):
    if cwd is None or "$" in path or "`" in path:
        return None
    full = os.path.normpath(os.path.join(cwd, os.path.expanduser(path)))
    # Resolve the parent only: removing a symlink deletes the link, not what it points at.
    return os.path.join(os.path.realpath(os.path.dirname(full)), os.path.basename(full))


def rm_args(words):
    recursive = force = False
    targets, i, end_of_flags = [], 1, False
    while i < len(words):
        word = words[i]
        if re.fullmatch(r"\d*[<>]+&?", word):
            i += 2
            continue
        if not end_of_flags and word == "--":
            end_of_flags = True
        elif not end_of_flags and word.startswith("--"):
            recursive |= word == "--recursive"
            force |= word == "--force"
        elif not end_of_flags and word.startswith("-") and len(word) > 1:
            recursive |= bool(set(word) & {"r", "R"})
            force |= "f" in word
        else:
            targets.append(word)
        i += 1
    return recursive, force, targets


def main():
    payload = json.load(sys.stdin)
    command = payload.get("tool_input", {}).get("command", "")
    if not re.search(r"\brm\b", command):
        return
    cwd = payload.get("cwd") or os.getcwd()
    try:
        parsed = list(segments(command))
    except ValueError:
        if re.search(r"\brm\s+(-\S+\s+)*-\S*[rR]", command):
            deny("Could not parse the command")
        return
    for words in parsed:
        while words and re.fullmatch(r"[A-Za-z_]\w*=.*", words[0]):
            words = words[1:]
        if not words:
            continue
        if words[0] == "cd":
            cwd = resolve(cwd, words[1] if len(words) > 1 else "~")
        elif os.path.basename(words[0]) == "rm":
            recursive, force, targets = rm_args(words)
            if not (recursive and force):
                continue
            for target in targets or ["."]:
                checked = GLOB.split(target, 1)[0] + "glob" if GLOB.search(target) else target
                real = resolve(cwd, checked)
                if real is None or not INSIDE_WORKTREE.search(real):
                    deny(f"`{target}` resolves to {real or 'an unknown path'}")


if __name__ == "__main__":
    main()
