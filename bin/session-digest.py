#!/usr/bin/env python3
"""Condense a Claude Code session transcript (plus its subagents) for /code:retro.

Usage: session-digest.py [SESSION_ID | #N | path.jsonl] [--timeline] [--record TIMESTAMP]
No argument digests the running session ($CLAUDE_CODE_SESSION_ID).
--timeline interleaves the assistant's narration with every tool call.
--record prints the full input and result of the calls made at a timestamp prefix.
"""
import glob
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime

PROJECTS = os.path.expanduser("~/.claude/projects")
REPO = re.compile(r"/Developer/([\w.-]+)(?:/\.claude/worktrees/([\w.-]+))?")


def transcripts():
    return sorted(glob.glob(f"{PROJECTS}/*/*.jsonl"), key=os.path.getmtime, reverse=True)


def resolve(arg):
    if not arg:
        arg = os.environ.get("CLAUDE_CODE_SESSION_ID") or sys.exit("no session id given and none running")
    if arg.endswith(".jsonl"):
        return arg, []
    issue = re.fullmatch(r"#(\d+)", arg)
    if issue:
        # The issue shows up in the opening prompt ("/ship #42", "/ship 42") or the session title.
        n = issue.group(1)
        mention = re.compile(rf"(?i)(#|/ship(?:-milestone)?\s+|/mod:ship\s+|issues/){n}\b")
        hits = []
        for path in transcripts():
            with open(path, errors="ignore") as f:
                head = "".join(next(f, "") for _ in range(60))
            if mention.search(head):
                hits.append(path)
        if not hits:
            sys.exit(f"no transcript mentions {arg} in its opening lines")
        return hits[0], hits[1:6]
    hits = [p for p in transcripts() if os.path.basename(p).startswith(arg)]
    if not hits:
        sys.exit(f"no transcript matches {arg}")
    return hits[0], []


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(x.get("text", "") for x in content if isinstance(x, dict))
    return ""


def summarise_input(name, inp):
    for key in ("command", "file_path", "pattern", "description", "skill", "url", "query", "prompt"):
        if key in inp:
            return f"{inp[key]}"
    return json.dumps(inp)[:200]


def one_line(s, n):
    s = " ".join(str(s).split())
    if len(s) <= n:
        return s
    # The tail of a long shell call is often the step that failed.
    return s[: n * 2 // 3] + " ~ " + s[-(n // 3):]


def parse(path):
    calls, prompts, texts, usage = {}, [], [], Counter()
    counted = set()
    first = last = None
    meta = {}
    for line in open(path, errors="ignore"):
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue
        ts = d.get("timestamp")
        if ts:
            first, last = first or ts, ts
        for k in ("cwd", "gitBranch"):
            if d.get(k):
                meta.setdefault(k, d[k])
        if d.get("type") == "custom-title":
            meta["title"] = d.get("customTitle")
        if d.get("reason") == "absorbed_mid_turn":
            prompts.append((ts, "(mid-turn) " + str(d.get("content"))))
        msg = d.get("message") or {}
        content = msg.get("content")
        if d.get("type") == "assistant":
            # One request is logged once per content block, each line repeating the same usage.
            rid = d.get("requestId") or msg.get("id") or d.get("uuid")
            if rid not in counted:
                counted.add(rid)
                u = msg.get("usage") or {}
                usage["api_calls"] += 1
                for k in ("output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"):
                    usage[k] += u.get(k) or 0
            for x in content if isinstance(content, list) else []:
                if x.get("type") == "text" and x.get("text", "").strip():
                    texts.append((ts, x["text"]))
                if x.get("type") == "tool_use":
                    inp = x.get("input") or {}
                    calls[x["id"]] = {"ts": ts, "name": x["name"], "input": summarise_input(x["name"], inp),
                                      "raw": inp, "size": 0, "error": None, "body": ""}
        elif d.get("type") == "user":
            if isinstance(content, list) and any(x.get("type") == "tool_result" for x in content):
                for x in content:
                    c = calls.get(x.get("tool_use_id"))
                    if c:
                        body = text_of(x.get("content"))
                        c["size"], c["body"] = len(body), body
                        if x.get("is_error"):
                            c["error"] = body
            elif not d.get("isMeta"):
                prompts.append((ts, text_of(content)))
    return {"calls": list(calls.values()), "prompts": prompts, "texts": texts, "usage": usage,
            "first": first, "last": last, "meta": meta}


def minutes(a, b):
    if not (a and b):
        return None
    at = lambda t: datetime.fromisoformat(t.replace("Z", "+00:00"))
    return round((at(b) - at(a)).total_seconds() / 60, 1)


def report(path, s, timeline):
    u, calls = s["usage"], s["calls"]
    print(f"# session {os.path.basename(path)}")
    idle = (time.time() - os.path.getmtime(path)) / 60
    if idle < 10 and os.path.basename(path)[:-6] != os.environ.get("CLAUDE_CODE_SESSION_ID"):
        print(f"WARNING: still running (written {idle:.0f} min ago), so its outcome is not in yet")
    print(f"path: {path}")
    print(f"title: {s['meta'].get('title')}  launched in: {s['meta'].get('cwd')} ({s['meta'].get('gitBranch')})")
    touched = Counter(m for c in calls for m in REPO.findall(json.dumps(c["raw"])))
    print("repos touched: " + ", ".join(f"{r}{' worktree ' + w if w else ''} x{n}" for (r, w), n in touched.most_common(6)))
    print(f"window: {s['first']} -> {s['last']} ({minutes(s['first'], s['last'])} min)")
    print(f"api calls {u['api_calls']}  tool calls {len(calls)}  output tok {u['output_tokens']}"
          f"  cache write {u['cache_creation_input_tokens']}  cache read {u['cache_read_input_tokens']}")

    if s["prompts"]:
        print("\n## User messages (corrections live here)")
        for ts, t in s["prompts"]:
            print(f"- {ts} {one_line(t, 400)}")

    by = defaultdict(lambda: [0, 0, 0])
    for c in calls:
        by[c["name"]][0] += 1
        by[c["name"]][1] += bool(c["error"])
        by[c["name"]][2] += c["size"]
    print("\n## Tools (calls / errors / result chars)")
    for name, (n, e, size) in sorted(by.items(), key=lambda kv: -kv[1][2]):
        print(f"- {name}: {n} / {e} / {size}")

    print("\n## Largest results (~chars/4 tokens)")
    for c in sorted(calls, key=lambda c: -c["size"])[:10]:
        print(f"- {c['ts']} {c['size']} {c['name']}: {one_line(c['input'], 160)}")

    errors = [c for c in calls if c["error"]]
    if errors:
        print(f"\n## Failed calls ({len(errors)})")
        for c in errors[:40]:
            print(f"- {c['ts']} {c['name']}: {one_line(c['input'], 120)}\n    -> {one_line(c['error'], 240)}")

    repeats = Counter((c["name"], c["input"]) for c in calls)
    repeats = [(k, n) for k, n in repeats.items() if n >= 3]
    if repeats:
        print("\n## Repeated identical calls")
        for (name, inp), n in sorted(repeats, key=lambda kv: -kv[1]):
            print(f"- x{n} {name}: {one_line(inp, 160)}")

    if timeline:
        print("\n## Timeline (> is the assistant's narration)")
        events = [(t, f"> {one_line(x, 300)}") for t, x in s["texts"]]
        events += [(c["ts"], f"{c['name']} {c['size']}{' ERR' if c['error'] else ''}: {one_line(c['input'], 180)}")
                   for c in calls]
        for t, line in sorted(events, key=lambda e: e[0] or ""):
            print(f"{t} {line}")


def record(s, prefix):
    for c in s["calls"]:
        if (c["ts"] or "").startswith(prefix):
            print(f"## {c['ts']} {c['name']}{' (error)' if c['error'] else ''}")
            print(json.dumps(c["raw"], indent=1)[:6000])
            print("--- result ---")
            print(c["body"][:6000])


def main():
    argv = sys.argv[1:]
    at = argv[argv.index("--record") + 1] if "--record" in argv else None
    args = [a for a in argv if not a.startswith("--") and a != at]
    path, others = resolve(args[0] if args else None)
    if at:
        return record(parse(path), at)
    report(path, parse(path), "--timeline" in argv)
    if others:
        print("\n## Other transcripts mentioning it (pass one by id to digest it)")
        for p in others:
            print(f"- {p}")
    subs = sorted(glob.glob(f"{path[:-6]}/subagents/*.jsonl"), key=os.path.getmtime)
    if subs:
        print(f"\n# Subagents ({len(subs)})")
        for sp in subs:
            s = parse(sp)
            brief = one_line(s["prompts"][0][1], 160) if s["prompts"] else ""
            errs = sum(bool(c["error"]) for c in s["calls"])
            print(f"- {os.path.basename(sp)}: api calls {s['usage']['api_calls']}, output tok {s['usage']['output_tokens']},"
                  f" calls {len(s['calls'])}, errors {errs}: {brief}")


if __name__ == "__main__":
    main()
