import type { CheckRow, Ledger, Phase, Run, RunSummary, Span, Usage } from '../types'

export const HISTORY_MAX = 200

type Interval = [number, number]

export type ApiUsage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export function emptyLedger(now: number): Ledger {
  return {
    phases: [{ phase: 'plan', startedAt: now }],
    turns: [],
    costByPhase: {},
    usage: {},
    subagentTokens: 0,
    subagents: [],
    ci: [],
    contextPeak: {},
    compactions: 0,
    searches: 0,
    assists: [],
  }
}

export function requestCachePct(api: ApiUsage): number | undefined {
  const all = api.input_tokens + api.cache_read_input_tokens + api.cache_creation_input_tokens
  return all === 0 ? undefined : Math.round((api.cache_read_input_tokens / all) * 100)
}

// Escalate once and never step back: each effort change can reset the main conversation's cache.
export function escalationReason(run: Run): string | undefined {
  if (run.ledger.escalation) return undefined
  if (run.ciFixPushes >= 2) return `CI red after ${run.ciFixPushes} fix pushes`
  if (run.cycles >= 2) return `CI red in cycle ${run.cycles + 1}`
  return undefined
}

export function noteMainRequest(ledger: Ledger, api: ApiUsage, boostedFrom: string | undefined, isBoosted: boolean): Ledger {
  const pct = requestCachePct(api)
  const esc = ledger.escalation
  if (isBoosted && esc && esc.cacheAfterPct === undefined) {
    return { ...ledger, lastMainCachePct: pct, escalation: { ...esc, from: esc.from ?? boostedFrom, cacheAfterPct: pct } }
  }
  return { ...ledger, lastMainCachePct: pct }
}

export function enterPhase(run: Run, phase: Phase, now: number): Run {
  if (run.phase === phase) return run
  const phases = run.ledger.phases.map(p => (p.endedAt === undefined ? { ...p, endedAt: now } : p))
  return { ...run, phase, ledger: { ...run.ledger, phases: [...phases, { phase, startedAt: now }] } }
}

export function closeOpenSpans(ledger: Ledger, now: number): Ledger {
  const close = <S extends Span>(spans: S[]) => spans.map(s => (s.endedAt === undefined ? { ...s, endedAt: now } : s))
  return { ...ledger, phases: close(ledger.phases), turns: close(ledger.turns) }
}

export const tokensOf = (u: Usage) => u.input + u.output + u.cacheRead + u.cacheWrite

export function addUsage(ledger: Ledger, phase: Phase, model: string, api: ApiUsage, agentId: string | undefined): Ledger {
  const byModel = ledger.usage[phase] ?? {}
  const prior = byModel[model] ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, requests: 0 }
  const next: Usage = {
    input: prior.input + api.input_tokens,
    output: prior.output + api.output_tokens,
    cacheRead: prior.cacheRead + api.cache_read_input_tokens,
    cacheWrite: prior.cacheWrite + api.cache_creation_input_tokens,
    requests: prior.requests + 1,
  }
  const isSubagent = agentId !== undefined
  const added = api.input_tokens + api.output_tokens + api.cache_read_input_tokens + api.cache_creation_input_tokens
  return {
    ...ledger,
    usage: { ...ledger.usage, [phase]: { ...byModel, [model]: next } },
    subagentTokens: ledger.subagentTokens + (isSubagent ? added : 0),
    subagents: isSubagent && !ledger.subagents.includes(agentId) ? [...ledger.subagents, agentId] : ledger.subagents,
  }
}

// The engine reports a running session total, so a phase is charged the rise since the last reading.
export function addCost(ledger: Ledger, phase: Phase, sessionUsd: number): Ledger {
  if (ledger.costSeenUsd === undefined) return { ...ledger, costSeenUsd: sessionUsd }
  const delta = Math.max(0, sessionUsd - ledger.costSeenUsd)
  return {
    ...ledger,
    costSeenUsd: sessionUsd,
    costByPhase: { ...ledger.costByPhase, [phase]: (ledger.costByPhase[phase] ?? 0) + delta },
  }
}

export function notePeak(ledger: Ledger, phase: Phase, percent: number): Ledger {
  if ((ledger.contextPeak[phase] ?? 0) >= percent) return ledger
  return { ...ledger, contextPeak: { ...ledger.contextPeak, [phase]: percent } }
}

function intervals(spans: Span[], until: number, from = 0): Interval[] {
  return spans
    .map(s => [Math.max(s.startedAt, from), Math.min(s.endedAt ?? until, until)] as Interval)
    .filter(([a, b]) => b > a)
}

function union(list: Interval[]): Interval[] {
  const sorted = [...list].sort((x, y) => x[0] - y[0])
  const out: Interval[] = []
  for (const [a, b] of sorted) {
    const last = out[out.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  return out
}

const length = (list: Interval[]) => list.reduce((sum, [a, b]) => sum + (b - a), 0)

function intersect(xs: Interval[], ys: Interval[]): Interval[] {
  const out: Interval[] = []
  for (const [a, b] of xs) {
    for (const [c, d] of ys) {
      const start = Math.max(a, c)
      const end = Math.min(b, d)
      if (end > start) out.push([start, end])
    }
  }
  return union(out)
}

export type TimeSplit = { wallMs: number; workingMs: number; waitingMs: number; idleMs: number }

export function timeSplit(run: Run, now: number): TimeSplit {
  const until = run.endedAt ?? now
  const wallMs = until - run.startedAt
  const working = union(intervals(run.ledger.turns, until, run.startedAt))
  const waits = union(intervals(run.ledger.ci, until))
  const workingMs = length(working)
  const waitingMs = length(waits) - length(intersect(waits, working))
  return { wallMs, workingMs, waitingMs, idleMs: Math.max(0, wallMs - workingMs - waitingMs) }
}

export type PhaseRow = {
  phase: Phase
  wallMs: number
  modelMs: number
  tokens: number
  costUsd: number
  cacheHitPct?: number
  mix: { model: string; share: number }[]
}

export function cacheHitPct(usages: Usage[]): number | undefined {
  const read = usages.reduce((s, u) => s + u.cacheRead, 0)
  const all = usages.reduce((s, u) => s + u.input + u.cacheRead + u.cacheWrite, 0)
  return all === 0 ? undefined : Math.round((read / all) * 100)
}

export function phaseRows(run: Run, now: number): PhaseRow[] {
  const until = run.endedAt ?? now
  const turns = union(intervals(run.ledger.turns, until, run.startedAt))
  const order: Phase[] = []
  for (const p of run.ledger.phases) if (!order.includes(p.phase)) order.push(p.phase)
  return order.map(phase => {
    const spans = union(intervals(run.ledger.phases.filter(p => p.phase === phase), until))
    const byModel = run.ledger.usage[phase] ?? {}
    const usages = Object.values(byModel)
    const tokens = usages.reduce((s, u) => s + tokensOf(u), 0)
    const mix = Object.entries(byModel)
      .map(([model, u]) => ({ model: shortModel(model), share: tokens === 0 ? 0 : Math.round((tokensOf(u) / tokens) * 100) }))
      .sort((a, b) => b.share - a.share)
    return {
      phase,
      wallMs: length(spans),
      modelMs: length(intersect(spans, turns)),
      tokens,
      costUsd: run.ledger.costByPhase[phase] ?? 0,
      cacheHitPct: cacheHitPct(usages),
      mix,
    }
  })
}

export function allUsages(run: Run): Usage[] {
  return Object.values(run.ledger.usage).flatMap(byModel => Object.values(byModel))
}

export function totalCost(run: Run): number {
  return Object.values(run.ledger.costByPhase).reduce((s, c) => s + c, 0)
}

export function checkMs(row: CheckRow): number | undefined {
  if (!row.startedAt || !row.completedAt) return undefined
  const ms = Date.parse(row.completedAt) - Date.parse(row.startedAt)
  return Number.isFinite(ms) && ms >= 0 ? ms : undefined
}

export function summarize(run: Run, now: number): RunSummary {
  const split = timeSplit(run, now)
  const until = run.endedAt ?? now
  return {
    issue: run.issue,
    kind: run.kind,
    outcome: run.outcome ?? 'unknown',
    endedAt: until,
    wallMs: split.wallMs,
    workingMs: split.workingMs,
    waitingMs: split.waitingMs,
    costUsd: totalCost(run),
    tokens: allUsages(run).reduce((s, u) => s + tokensOf(u), 0),
    cacheHitPct: cacheHitPct(allUsages(run)) ?? 0,
    ciRuns: run.ledger.ci.length,
    ciMs: length(intervals(run.ledger.ci, until)),
    fixPushes: run.ciFixPushes,
    cycles: run.cycles,
  }
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

export type Comparison = { runs: number; costPct?: number; wallPct?: number; waitingPct?: number; ciPct?: number }

export function compare(current: RunSummary, history: RunSummary[]): Comparison | undefined {
  const same = history.filter(h => h.kind === current.kind && h.issue !== current.issue)
  if (same.length === 0) return undefined
  const pct = (value: number, pick: (h: RunSummary) => number) => {
    const m = median(same.map(pick))
    return m === undefined || m === 0 ? undefined : Math.round(((value - m) / m) * 100)
  }
  return {
    runs: same.length,
    costPct: pct(current.costUsd, h => h.costUsd),
    wallPct: pct(current.wallMs, h => h.wallMs),
    waitingPct: pct(current.waitingMs, h => h.waitingMs),
    ciPct: pct(current.ciMs, h => h.ciMs),
  }
}

export function shortModel(model: string): string {
  const family = model.match(/fable|mythos|opus|sonnet|haiku/i)?.[0]
  return family ? family.toLowerCase() : model
}

export function fmtMs(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return `${Math.round(ms / 1000)}s`
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

export const fmtUsd = (usd: number) => `$${usd.toFixed(2)}`

export const fmtPct = (pct: number | undefined) => (pct === undefined ? 'n/a' : `${pct > 0 ? '+' : ''}${pct}%`)
