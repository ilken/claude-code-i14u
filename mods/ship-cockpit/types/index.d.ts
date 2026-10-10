export type Phase =
  | 'plan'
  | 'implement'
  | 'design-check'
  | 'review'
  | 'pr'
  | 'ci'
  | 'ci-fix'
  | 'review-fix'
  | 'loop'
  | 'done'

export type CheckRow = { name: string; bucket: string; link?: string; startedAt?: string; completedAt?: string }

export type WaitKind = 'ci'

export type Wait = { kind: WaitKind; armedAt: number; deadlineAt: number }

export type Span = { startedAt: number; endedAt?: number; id?: string }

export type PhaseSpan = Span & { phase: Phase }

export type Usage = { input: number; output: number; cacheRead: number; cacheWrite: number; requests: number }

export type CiCycle = Span & {
  verdict?: string
  checks: CheckRow[]
  causes: string[]
  fixPushes: number
  reruns: number
}

export type Escalation = {
  at: number
  reason: string
  to: 'max'
  from?: string
  cacheBeforePct?: number
  cacheAfterPct?: number
}

export type Assist = { kind: 'ci-diagnosis' | 'digest'; ms: number; tokens: number; isOk: boolean }

export type Ledger = {
  escalation?: Escalation
  lastMainCachePct?: number
  assists: Assist[]
  phases: PhaseSpan[]
  turns: Span[]
  costByPhase: Record<string, number>
  usage: Record<string, Record<string, Usage>>
  subagentTokens: number
  subagents: string[]
  ci: CiCycle[]
  contextPeak: Record<string, number>
  compactions: number
  searches: number
  costBaseUsd?: number
  costSeenUsd?: number
}

export type Run = {
  issue: string
  title: string
  repo: string
  kind: string
  agentId?: string
  phase: Phase
  pr?: number
  prUrl?: string
  ciFixPushes: number
  cycles: number
  checks: CheckRow[]
  wait?: Wait
  lastVerdict?: string
  pollErrors: number
  startedAt: number
  heartbeatAt: number
  endedAt?: number
  outcome?: string
  ledger: Ledger
}

export type RunSummary = {
  issue: string
  kind: string
  outcome: string
  endedAt: number
  wallMs: number
  workingMs: number
  waitingMs: number
  costUsd: number
  tokens: number
  cacheHitPct: number
  ciRuns: number
  ciMs: number
  fixPushes: number
  cycles: number
}

declare module 'claude-code' {
  interface PluginState {
    'ship-cockpit': { runs: Run[]; history: RunSummary[] }
  }
}
