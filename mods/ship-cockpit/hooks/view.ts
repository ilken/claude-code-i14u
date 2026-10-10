import type { CheckRow, Phase, Run, RunSummary } from '../types'

import {
  allUsages,
  cacheHitPct,
  checkMs,
  compare,
  fmtMs,
  fmtTokens,
  fmtUsd,
  phaseRows,
  summarize,
  timeSplit,
  totalCost,
  tokensOf,
} from './ledger'
import { CAP, failing } from './logic'

export type Tone = 'error' | 'success' | 'warning' | 'claude' | 'subtle' | 'suggestion' | 'inactive'

export type Seg = { text: string; tone?: Tone; bold?: boolean; dim?: boolean; inverse?: boolean }
export type Cell = { segs: Seg[]; width?: number; align?: 'right' }
export type Row = Cell[]
export type Section = { title: string; tone?: Tone; rows: Row[] }

export const ICON = { done: '✔', fail: '✘', run: '◐', warn: '⚠', on: '●', off: '○', sub: '↳', rerun: '↻', up: '▲', down: '▼' }

const CONTEXT_WARN_PCT = 80
const BAR = 10
const NARROW = 70

const PHASE_LABEL: Record<Phase, string> = {
  plan: 'Plan',
  implement: 'Implement',
  'design-check': 'Design check',
  review: 'Opus review',
  pr: 'Pull request',
  ci: 'CI',
  'ci-fix': 'CI fix',
  'review-fix': 'Review fix',
  loop: 'Rebase loop',
  done: 'Done',
}

const KIND_LABEL: Record<string, string> = { backend: 'Backend', app: 'App', web: 'Web', other: 'Other' }

const seg = (text: string, style: Omit<Seg, 'text'> = {}): Seg => ({ text, ...style })
const cell = (segs: Seg | Seg[], width?: number, align?: 'right'): Cell => ({ segs: Array.isArray(segs) ? segs : [segs], width, align })
const capital = (s: string) => (s === '' ? s : s[0]!.toUpperCase() + s.slice(1))
const share = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100))
const checkName = (name: string) => capital(name.replace(/-/g, ' '))

export function bar(pct: number, width = BAR, tone: Tone = 'claude'): Seg[] {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)))
  return [seg('█'.repeat(filled), { tone }), seg('░'.repeat(width - filled), { dim: true })]
}

function pips(used: number, cap: number): Seg[] {
  const tone: Tone = used >= cap ? 'error' : used >= cap - 1 ? 'warning' : 'success'
  return [seg(ICON.on.repeat(Math.min(used, cap)), { tone }), seg(ICON.off.repeat(Math.max(0, cap - used)), { dim: true })]
}

function trend(label: string, pct: number | undefined): Seg[] {
  if (pct === undefined) return [seg(`${label} n/a`, { dim: true })]
  const isUp = pct > 0
  const tone: Tone = pct === 0 ? 'subtle' : isUp ? 'error' : 'success'
  return [seg(`${isUp ? ICON.up : pct < 0 ? ICON.down : '='} ${Math.abs(pct)}% `, { tone, bold: true }), seg(label, { dim: true })]
}

function stateChip(run: Run): Seg {
  if (!run.endedAt) return seg(` ${PHASE_LABEL[run.phase].toUpperCase()} `, { tone: 'claude', inverse: true, bold: true })
  const tone: Tone = run.outcome === 'needs-attention' ? 'error' : run.outcome === 'green-design-pending' ? 'warning' : 'success'
  return seg(` ${(run.outcome ?? 'ended').replace(/-/g, ' ').toUpperCase()} `, { tone, inverse: true, bold: true })
}

function headerSection(run: Run, now: number): Section {
  const usages = allUsages(run)
  const tokens = usages.reduce((s, u) => s + tokensOf(u), 0)
  const split = timeSplit(run, now)
  const icon = !run.endedAt ? ICON.run : run.outcome === 'needs-attention' ? ICON.fail : ICON.done
  const iconTone: Tone = !run.endedAt ? 'claude' : run.outcome === 'needs-attention' ? 'error' : 'success'
  const where = [KIND_LABEL[run.kind] ?? capital(run.kind), run.pr ? `PR #${run.pr}` : undefined].filter(Boolean).join(' · ')
  return {
    title: run.issue,
    tone: iconTone,
    rows: [
      [cell([seg(`${icon} `, { tone: iconTone, bold: true }), seg(run.title, { bold: true })]), cell(seg(where, { dim: true }), undefined, 'right')],
      [
        cell([
          stateChip(run),
          seg(`  ${fmtMs(split.wallMs)}`, { bold: true }),
          seg(' wall  ', { dim: true }),
          seg(fmtUsd(totalCost(run)), { bold: true, tone: 'suggestion' }),
          seg('  ', {}),
          seg(fmtTokens(tokens), { bold: true }),
          seg(' tokens  ', { dim: true }),
          seg(`${cacheHitPct(usages) ?? 0}%`, { bold: true }),
          seg(' cache', { dim: true }),
        ]),
      ],
    ],
  }
}

function phaseSection(run: Run, now: number, columns: number): Section {
  const rows = phaseRows(run, now).filter(r => r.phase !== 'done' && (r.wallMs > 0 || r.tokens > 0))
  const totalUsd = rows.reduce((s, r) => s + r.costUsd, 0)
  const isWide = columns >= NARROW
  const head: Row = [
    cell(seg('', {}), 2),
    cell(seg('Phase', { dim: true, bold: true }), 14),
    cell(seg('Wall', { dim: true, bold: true }), 6, 'right'),
    cell(seg('Model', { dim: true, bold: true }), 6, 'right'),
    cell(seg('Tokens', { dim: true, bold: true }), 7, 'right'),
    cell(seg('Cost', { dim: true, bold: true }), 7, 'right'),
    ...(isWide ? [cell(seg('Share', { dim: true, bold: true }), BAR + 1), cell(seg('Models', { dim: true, bold: true }))] : []),
  ]
  const body = rows.map((r): Row => {
    const isCurrent = !run.endedAt && r.phase === run.phase
    const mix = r.mix.map(m => `${capital(m.model)}${r.mix.length > 1 ? ` ${m.share}%` : ''}`).join(' · ')
    return [
      cell(seg(isCurrent ? ICON.run : ICON.done, { tone: isCurrent ? 'claude' : 'success' }), 2),
      cell(seg(PHASE_LABEL[r.phase], { bold: isCurrent }), 14),
      cell(seg(fmtMs(r.wallMs)), 6, 'right'),
      cell(seg(fmtMs(r.modelMs), { dim: true }), 6, 'right'),
      cell(seg(fmtTokens(r.tokens)), 7, 'right'),
      cell(seg(fmtUsd(r.costUsd), { tone: 'suggestion' }), 7, 'right'),
      ...(isWide ? [cell([seg(' '), ...bar(share(r.costUsd, totalUsd))], BAR + 1), cell(seg(mix, { dim: true }))] : []),
    ]
  })
  return { title: 'Phases', rows: [head, ...body] }
}

function timeSection(run: Run, now: number): Section {
  const split = timeSplit(run, now)
  const width = 24
  const working = Math.round((split.workingMs / Math.max(1, split.wallMs)) * width)
  const waiting = Math.round((split.waitingMs / Math.max(1, split.wallMs)) * width)
  const idle = Math.max(0, width - working - waiting)
  const legend = (label: string, ms: number, tone: Tone): Seg[] => [
    seg(`${ICON.on} `, { tone }),
    seg(`${label} `, {}),
    seg(`${fmtMs(ms)} `, { bold: true }),
    seg(`${share(ms, split.wallMs)}%   `, { dim: true }),
  ]
  return {
    title: 'Time',
    rows: [
      [cell([seg('█'.repeat(working), { tone: 'claude' }), seg('█'.repeat(waiting), { tone: 'warning' }), seg('░'.repeat(idle), { dim: true })])],
      [cell([...legend('Working', split.workingMs, 'claude'), ...legend('Waiting', split.waitingMs, 'warning'), ...legend('Idle', split.idleMs, 'inactive')])],
    ],
  }
}

function slowest(checks: CheckRow[]): string {
  return checks
    .map(c => ({ name: checkName(c.name), ms: checkMs(c) }))
    .filter((c): c is { name: string; ms: number } => c.ms !== undefined && c.ms >= 1000)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 3)
    .map(c => `${c.name} ${fmtMs(c.ms)}`)
    .join(' · ')
}

function verdictIcon(verdict: string | undefined): Seg {
  if (verdict === 'green') return seg(ICON.done, { tone: 'success' })
  if (verdict === 'red') return seg(ICON.fail, { tone: 'error' })
  if (verdict === undefined) return seg(ICON.run, { tone: 'claude' })
  return seg(ICON.warn, { tone: 'warning' })
}

function ciSection(run: Run, now: number): Section | undefined {
  const rows: Row[] = []
  run.ledger.ci.forEach((cycle, i) => {
    const until = cycle.endedAt ?? run.endedAt ?? now
    const detail = slowest(cycle.checks)
    rows.push([
      cell(verdictIcon(cycle.verdict), 2),
      cell(seg(`CI #${i + 1}`, { bold: true }), 14),
      cell(seg(fmtMs(until - cycle.startedAt)), 6, 'right'),
      cell([seg('  '), seg(capital(cycle.verdict ?? 'running')), seg(detail ? `   ${detail}` : '', { dim: true })]),
    ])
    if (cycle.causes.length > 0 || cycle.fixPushes > 0 || cycle.reruns > 0) {
      const causes = cycle.causes.map(checkName).join(', ')
      rows.push([
        cell(seg('', {}), 2),
        cell([
          seg(`${ICON.sub} `, { dim: true }),
          seg('Caused by ', { dim: true }),
          seg(causes || 'unknown', { tone: 'error' }),
          seg(`   ${cycle.fixPushes} fix push${cycle.fixPushes === 1 ? '' : 'es'}`, { dim: true }),
          seg(cycle.reruns > 0 ? `   ${ICON.rerun} ${cycle.reruns} rerun` : '', { dim: true }),
        ]),
      ])
    }
  })
  return rows.length === 0 ? undefined : { title: 'CI', rows }
}

function effortSegs(run: Run): Seg[] {
  const esc = run.ledger.escalation
  if (!esc) return [seg(`${ICON.done} `, { tone: 'success' }), seg('Steady, cache untouched', { dim: true })]
  const before = esc.cacheBeforePct
  const after = esc.cacheAfterPct
  const kept = before === undefined || after === undefined ? undefined : after >= before - 10
  return [
    seg(`${ICON.up} `, { tone: 'warning', bold: true }),
    seg(`${capital(esc.from ?? 'default')} to Max`, { bold: true }),
    seg(`  ${esc.reason}`, { dim: true }),
    seg(after === undefined ? '   cache pending' : `   cache ${before ?? '?'}% to ${after}%`, {
      tone: kept === false ? 'error' : kept ? 'success' : undefined,
    }),
  ]
}

function assistSegs(run: Run): Seg[] {
  const assists = run.ledger.assists ?? []
  const count = (kind: string) => assists.filter(a => a.kind === kind).length
  const parts = [
    count('ci-diagnosis') > 0 ? `${count('ci-diagnosis')} CI diagnosis` : '',
    count('digest') > 0 ? `${count('digest')} digest` : '',
  ].filter(Boolean)
  const failed = assists.filter(a => !a.isOk).length
  return [
    seg(parts.join(' · ')),
    seg(`   ${fmtTokens(assists.reduce((s, a) => s + a.tokens, 0))} tokens · ${fmtMs(assists.reduce((s, a) => s + a.ms, 0))}`, { dim: true }),
    seg(failed > 0 ? `   ${ICON.warn} ${failed} gave nothing` : '', { tone: 'warning' }),
  ]
}

function healthSection(run: Run): Section {
  const usages = allUsages(run)
  const cache = cacheHitPct(usages) ?? 0
  const peak = Object.entries(run.ledger.contextPeak).sort((a, b) => b[1] - a[1])[0]
  const peakPct = peak ? Math.round(peak[1]) : 0
  const contextTone: Tone = peakPct >= CONTEXT_WARN_PCT ? 'warning' : 'claude'
  const label = (text: string) => cell(seg(text, { dim: true }), 14)
  return {
    title: 'Health',
    rows: [
      [label('Cache hit'), cell([...bar(cache, BAR, 'success'), seg(`  ${cache}%`, { bold: true })])],
      [
        label('Context peak'),
        cell([
          ...bar(peakPct, BAR, contextTone),
          seg(`  ${peakPct}%`, { bold: true, tone: peakPct >= CONTEXT_WARN_PCT ? 'warning' : undefined }),
          seg(peak ? ` in ${PHASE_LABEL[peak[0] as Phase] ?? peak[0]}` : '', { dim: true }),
          seg(`   ${run.ledger.compactions} compaction${run.ledger.compactions === 1 ? '' : 's'}`, { dim: true }),
        ]),
      ],
      [label('CI-fix pushes'), cell([...pips(run.ciFixPushes, CAP), seg(`  ${run.ciFixPushes}/${CAP}`, { dim: true })])],
      [label('Review cycles'), cell([...pips(run.cycles, CAP), seg(`  ${run.cycles}/${CAP}`, { dim: true })])],
      [label('Effort'), cell(effortSegs(run))],
      [label('Searches'), cell(seg(String(run.ledger.searches)))],
      ...((run.ledger.assists ?? []).length > 0 ? [[label('Haiku assists'), cell(assistSegs(run))]] : []),
      ...(run.ledger.subagents.length > 0
        ? [[label('Subagents'), cell(seg(`${run.ledger.subagents.length} · ${fmtTokens(run.ledger.subagentTokens)} tokens`))]]
        : []),
    ],
  }
}

function trendSection(run: Run, history: RunSummary[], now: number): Section {
  const vs = compare(summarize(run, now), history)
  const kind = KIND_LABEL[run.kind] ?? capital(run.kind)
  if (!vs) return { title: 'Trend', rows: [[cell(seg(`First recorded ${kind} run. Comparisons start with the next one.`, { dim: true }))]] }
  return {
    title: `Trend vs median of ${vs.runs} ${kind} runs`,
    rows: [[cell([...trend('cost', vs.costPct), seg('    '), ...trend('wall', vs.wallPct), seg('    '), ...trend('waiting', vs.waitingPct), seg('    '), ...trend('CI', vs.ciPct)])]],
  }
}

function liveSection(run: Run, now: number): Section | undefined {
  if (run.endedAt) return undefined
  const rows: Row[] = []
  if (run.wait) {
    const total = Math.max(1, run.wait.deadlineAt - run.wait.armedAt)
    const elapsed = now - run.wait.armedAt
    rows.push([
      cell(seg(ICON.run, { tone: 'warning' }), 2),
      cell([
        seg('Waiting on CI  ', { bold: true }),
        ...bar(share(elapsed, total), BAR, 'warning'),
        seg(`  ${fmtMs(elapsed)} of ${fmtMs(total)}`, { dim: true }),
      ]),
    ])
  }
  for (const c of failing(run.checks).slice(0, 4)) rows.push([cell(seg(ICON.fail, { tone: 'error' }), 2), cell(seg(checkName(c.name), { tone: 'error' }))])
  if (run.pollErrors > 0) rows.push([cell(seg(ICON.warn, { tone: 'error' }), 2), cell(seg(`Poll errors ${run.pollErrors}`, { tone: 'error' }))])
  rows.push([cell(seg('', {}), 2), cell(seg(`Heartbeat ${Math.round((now - run.heartbeatAt) / 1000)}s ago`, { dim: true }))])
  return { title: 'Now', tone: 'warning', rows }
}

export function runSections(run: Run, history: RunSummary[], now: number, columns = 100): Section[] {
  const sections = [
    headerSection(run, now),
    liveSection(run, now),
    phaseSection(run, now, columns),
    timeSection(run, now),
    ciSection(run, now),
    healthSection(run),
    trendSection(run, history, now),
  ]
  return sections.filter((s): s is Section => s !== undefined)
}

export function olderRunRow(run: Run, now: number): Row {
  const s = summarize(run, now)
  const failed = run.outcome === 'needs-attention'
  return [
    cell(seg(failed ? ICON.fail : ICON.done, { tone: failed ? 'error' : 'success' }), 2),
    cell(seg(run.issue, { bold: true }), 12),
    cell(seg(fmtMs(s.wallMs)), 7, 'right'),
    cell(seg(fmtUsd(s.costUsd), { tone: 'suggestion' }), 8, 'right'),
    cell(seg(`${fmtTokens(s.tokens)} tokens`, { dim: true }), 14, 'right'),
  ]
}

export const sectionText = (section: Section) =>
  [section.title, ...section.rows.map(r => r.map(c => c.segs.map(s => s.text).join('')).join(' '))].join('\n')
