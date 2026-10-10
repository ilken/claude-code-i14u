# Model & Effort Selection

Pick the cheapest model that does the job correctly; spend effort where being wrong is expensive. Pattern: **tier-by-phase** — top tier for *decisions* (planning, gnarly debugging, review), Sonnet/Haiku for *execution*.

## Durable rules

1. **Match effort to the cost of being wrong, not task size.** A small auth change deserves more than a large rename.
2. **Plan and review on the top tier; implement one tier down.** Planning errors compound; a precise plan makes implementation Sonnet-safe.
3. **Escalate, don't grind.** Two failed attempts on one sub-problem → go up a tier.
4. **No max effort on implementation** once the plan is unambiguous. Highest effort is for planning, grilling and root-cause-unknown debugging.
5. **A cheaper model's implementation is only as good as the plan** — hand-offs need the plan output standard in `ralf-loop.md`.
6. **Lean on prompt caching.** Switching model mid-session cold-starts the cache.
7. **Review in a fresh context.** The model that wrote the code reviews it badly in the same window; use an Opus agent (`charmander`) that sees only the diff and the intent.

## RALF phase mapping

| Phase | Tier |
|---|---|
| Read | current model; Explore subagents for fan-out |
| Analyse + Plan (incl. grilling) | top tier, xhigh |
| Implement + Lint | Sonnet, high |
| Mechanical sub-tasks | Haiku |
| Review before PR | Opus, high, fresh-context agent |

## Two switching mechanisms

1. **Main session** — Claude can't switch its own model; only `/model` can. Suggest a switch briefly at real transitions (plan approved → Sonnet; 2 failed attempts → top tier). Inside `/ship` and `/mod:ship`, never suggest a switch: one model for the whole run keeps the cache.
2. **Subagents** — pass `model: "fable" | "opus" | "sonnet" | "haiku"` on the `Agent` tool. Keeps the main loop on the top tier while farming out work.

## Current models (reviewed 2026-10-10 — update on each release)

Verify against the `claude-api` skill before trusting this table.

| Model | ID | Use |
|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | hardest long-horizon work, deep planning, unknown root causes |
| Opus 5.5 | `claude-opus-5-5` | default top tier: planning, review |
| Sonnet 5.5 | `claude-sonnet-5-5` | implementation against a clear plan, lint loops |
| Haiku 5.5 | `claude-haiku-5-5` | renames, boilerplate, scaffolding, search |

Effort: **xhigh** for planning, grilling, hard debugging; **high** for implementation and review; **medium/low** for mechanical work.
