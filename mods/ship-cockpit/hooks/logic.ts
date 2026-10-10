import type { CheckRow, Phase, Run } from '../types'

// The caps mirror .claude/commands/ship.md; change both together.
export const CAP = 5
export const POLL_MS = 60_000
export const CI_DEADLINE_MIN = 60
export const CI_GRACE_MS = 120_000
export const CI_MISSING_MIN = 5
export const MAX_POLL_ERRORS = 5

export const PHASES: readonly Phase[] = [
  'plan',
  'implement',
  'design-check',
  'review',
  'pr',
  'ci',
  'ci-fix',
  'review-fix',
  'loop',
  'done',
]

type Counters = Pick<Run, 'phase' | 'ciFixPushes' | 'cycles'> & Partial<Pick<Run, 'pr' | 'repo'>>

export function splitSegments(command: string): string[] {
  const segments: string[] = []
  let current = ''
  let quote: string | undefined
  for (let i = 0; i < command.length; i++) {
    const c = command[i]
    if (quote) {
      if (c === '\\' && quote === '"') {
        current += c + (command[i + 1] ?? '')
        i++
        continue
      }
      if (c === quote) quote = undefined
      current += c
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      current += c
      continue
    }
    const isRedirect = c === '&' && (command[i - 1] === '>' || command[i + 1] === '>')
    if (!isRedirect && (c === ';' || c === '\n' || c === '|' || c === '&')) {
      segments.push(current)
      current = ''
      if ((c === '|' || c === '&') && command[i + 1] === c) i++
      continue
    }
    current += c
  }
  segments.push(current)
  return segments.map(s => s.trim()).filter(s => s.length > 0)
}

function words(segment: string): string[] {
  const all = (segment.match(/"(?:\\.|[^"])*"|'[^']*'|\S+/g) ?? []).map(w => w.replace(/^["']|["']$/g, ''))
  const isPrefix = (w: string) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(w) || w === 'command' || w === 'env'
  let start = 0
  while (start < all.length && isPrefix(all[start] ?? '')) start++
  return all.slice(start)
}

function gitSubcommand(ws: string[]): { sub: string; args: string[]; dir?: string } | undefined {
  if (ws[0] !== 'git') return undefined
  let i = 1
  let dir: string | undefined
  while ((ws[i] ?? '').startsWith('-')) {
    if (ws[i] === '-C') dir = ws[i + 1]
    i += ws[i] === '-C' || ws[i] === '-c' ? 2 : 1
  }
  const sub = ws[i]
  return sub === undefined ? undefined : { sub, args: ws.slice(i + 1), dir }
}

// Learnings land in claude-code-i14u mid-run and merge at once; they are not the issue's pushes.
const isConfigRepo = (path: string | undefined) => path !== undefined && path.includes('claude-code-i14u')

type Push = { args: string[]; isConfig: boolean }

function pushesIn(command: string): Push[] {
  const pushes: Push[] = []
  let cdConfig = false
  for (const seg of splitSegments(command)) {
    const ws = words(seg)
    if (ws[0] === 'cd') cdConfig = isConfigRepo(ws[1])
    const git = gitSubcommand(ws)
    if (git?.sub === 'push') pushes.push({ args: git.args, isConfig: cdConfig || isConfigRepo(git.dir) })
  }
  return pushes
}

export function isRunPush(command: string): boolean {
  return pushesIn(command).some(p => !p.isConfig)
}

function mergesRunPr(args: string[], run: Counters): boolean {
  const repoAt = args.findIndex(a => a === '--repo' || a === '-R')
  const repo = repoAt >= 0 ? args[repoAt + 1] : undefined
  const target = args.find((a, i) => !a.startsWith('-') && (repoAt < 0 || i !== repoAt + 1))
  const isRunRepo = repo === undefined || repo === run.repo
  return isRunRepo && target !== undefined && (target === String(run.pr) || target.endsWith(`/pull/${run.pr}`))
}

export function isPrCreate(command: string): boolean {
  return splitSegments(command).some(seg => {
    const ws = words(seg)
    return ws[0] === 'gh' && ws[1] === 'pr' && ws[2] === 'create'
  })
}

function capDenial(run: Counters): string | undefined {
  if (run.phase === 'ci-fix' && run.ciFixPushes >= CAP) {
    return `the cap of ${CAP} CI-fix pushes is reached. Stop and go to Phase 6 with needs-attention.`
  }
  if ((run.phase === 'review-fix' || run.phase === 'loop') && run.cycles >= CAP) {
    return `the cap of ${CAP} review cycles is reached. Stop and go to Phase 6 with needs-attention.`
  }
  return undefined
}

function pushDenial({ args, isConfig }: Push, run: Counters): string | undefined {
  const refs = args.filter(a => !a.startsWith('-'))
  if (refs.some(r => /(^|:)(refs\/heads\/)?(main|master)$/.test(r.replace(/^\+/, '')))) {
    return 'pushing to main or master is never allowed. Push the issue branch.'
  }
  const isBareForce =
    args.some(a => a === '--force' || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a)) || refs.some(r => r.startsWith('+'))
  if (isBareForce) {
    return 'a bare force push is not allowed. After a rebase, use git push --force-with-lease on this run\'s own branch.'
  }
  return isConfig ? undefined : capDenial(run)
}

export function bashDenial(command: string, run: Counters | undefined): string | undefined {
  if (!run) return undefined
  for (const push of pushesIn(command)) {
    const denial = pushDenial(push, run)
    if (denial) return denial
  }
  for (const seg of splitSegments(command)) {
    const ws = words(seg)
    if (ws[0] === 'gh' && ws[1] === 'pr' && ws[2] === 'merge' && mergesRunPr(ws.slice(3), run)) {
      return '/mod:ship never merges the issue PR. Leave it open and finish at Phase 6.'
    }
    const isVerdictReview = ws.some(a => ['--approve', '-a', '--request-changes', '-r'].includes(a))
    if (ws[0] === 'gh' && ws[1] === 'pr' && ws[2] === 'review' && isVerdictReview) {
      return '/mod:ship never submits an APPROVE or REQUEST_CHANGES review.'
    }
  }
  return undefined
}

export function countPush<R extends Counters>(run: R): R {
  if (run.phase === 'ci-fix') return { ...run, ciFixPushes: run.ciFixPushes + 1 }
  if (run.phase === 'review-fix' || run.phase === 'loop') return { ...run, cycles: run.cycles + 1 }
  return run
}

export function prFrom(text: string): { url: string; repo: string; number: number } | undefined {
  const m = text.match(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)/)
  return m?.[1] && m[2] ? { url: m[0], repo: m[1], number: Number(m[2]) } : undefined
}

export function runPrFrom(command: string, output: string, runRepo: string): ReturnType<typeof prFrom> {
  const pr = isPrCreate(command) ? prFrom(output) : undefined
  return pr && pr.repo.toLowerCase() === runRepo.toLowerCase() ? pr : undefined
}

export function parseChecks(stdout: string): CheckRow[] | undefined {
  try {
    const rows: unknown = JSON.parse(stdout)
    if (!Array.isArray(rows)) return undefined
    return rows.map(r => {
      const row = r as Record<string, unknown>
      const text = (key: string) => (typeof row[key] === 'string' && row[key] !== '' ? (row[key] as string) : undefined)
      return {
        name: String(row.name ?? ''),
        bucket: String(row.bucket ?? ''),
        link: text('link'),
        startedAt: text('startedAt'),
        completedAt: text('completedAt'),
      }
    })
  } catch {
    return undefined
  }
}

export type CiVerdict = 'pending' | 'red' | 'green' | 'missing'

// The grace stops a verdict on the checks GitHub shows before the new head's runs are posted.
// Actions posts a check within a minute of a push; none after CI_MISSING_MIN means no CI for this PR.
export function ciVerdict(checks: CheckRow[], sinceArmedMs: number): CiVerdict {
  if (checks.length === 0) return sinceArmedMs >= CI_MISSING_MIN * 60_000 ? 'missing' : 'pending'
  if (sinceArmedMs < CI_GRACE_MS) return 'pending'
  if (checks.some(c => c.bucket === 'pending')) return 'pending'
  if (checks.some(c => c.bucket === 'fail' || c.bucket === 'cancel')) return 'red'
  return 'green'
}

export function failing(checks: CheckRow[]): CheckRow[] {
  return checks.filter(c => c.bucket === 'fail' || c.bucket === 'cancel')
}

export function checksSummary(checks: CheckRow[]): string {
  if (checks.length === 0) return 'no checks yet'
  const count = (bucket: string) => checks.filter(c => c.bucket === bucket).length
  const parts = [`${count('pass')} pass`]
  if (failing(checks).length > 0) parts.push(`${failing(checks).length} failing`)
  if (count('pending') > 0) parts.push(`${count('pending')} running`)
  return parts.join(' · ')
}

export function statusLine(run: Run, now: number): string {
  const isRed = failing(run.checks).length > 0
  const parts = [`◐ ${run.issue}`, run.phase[0]!.toUpperCase() + run.phase.slice(1)]
  if (run.pr) parts.push(`PR #${run.pr}`)
  if (run.checks.length > 0) parts.push(`${isRed ? '✘' : '✔'} CI ${checksSummary(run.checks)}`)
  if (run.wait) parts.push(`Waiting CI ${Math.floor((now - run.wait.armedAt) / 60_000)}m`)
  parts.push(`Cycle ${run.cycles}/${CAP}`)
  return parts.join(' · ')
}

const SEARCH_WORDS = new Set(['rg', 'grep', 'find', 'ag', 'fd'])

export function isSearchCommand(command: string): boolean {
  return splitSegments(command).some(seg => {
    const ws = words(seg)
    return SEARCH_WORDS.has(ws[0] ?? '') || (ws[0] === 'git' && ws[1] === 'grep')
  })
}

export function isRerun(command: string): boolean {
  return splitSegments(command).some(seg => {
    const ws = words(seg)
    return ws[0] === 'gh' && ws[1] === 'run' && ws[2] === 'rerun'
  })
}
