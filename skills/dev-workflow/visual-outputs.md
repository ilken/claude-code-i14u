# Visual Outputs

Where a diagram replaces text at a point someone approves work. The terminal does not render Mermaid: never print Mermaid source as the thing to approve; put it where it renders.

## Rules for every diagram

- **Draw it from the diff or the schema**, never from the plan — a diagram of the plan only repeats it.
- **Real names:** issue numbers, file, table and column names. Never "Service A".
- **12 nodes at most.** Bigger means two changes, or no value. Drop it.
- **No colour in Mermaid** — literal colours break one theme. Put state in the label.

## Where

| Review point | Renders in | Diagram |
|---|---|---|
| Plan comment on a GitHub issue touching 3+ files or 2+ modules | GitHub | `flowchart LR` of the touched path, nodes marked `(new)` / `(changed)` |
| PR body, change spans 2+ modules | GitHub | the same, redrawn from the final diff. Optional; fenced lines don't count toward `pr-check` caps |
| `/ship-milestone` order, stops and finish | the run board Artifact | below |

A plan inside one module gets no diagram.

## The run board (`/ship-milestone`)

One Artifact per milestone run (load `artifact-design` first). File `~/.claude/ship-milestone/{repo}--{milestone-slug}.html`, next to the run state file; republishing the same path keeps one URL — record it in the state file.

Publish at: the order approval (`graph LR` of the queue; dashed edges for inferred dependencies), a stop (the issue, the reason, what the user must decide), and the finish (`{n}/{total} merged`). Rank content by what needs the user: their to-dos, decisions made on their behalf, the queue table (position, issue, outcome, PR, merge commit), coherence findings. Plain sentences (`writing-rules.md` §3).
