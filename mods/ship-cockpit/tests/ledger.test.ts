import { describe, expect, mock, test } from 'claude-code/testing'

import type { Run, RunSummary } from '../types'
import { addCost, addUsage, compare, emptyLedger, enterPhase, phaseRows, timeSplit } from '../hooks/ledger'
import { runSections, sectionText } from '../hooks/view'

const MIN = 60_000

function baseRun(): Run {
  return {
    issue: '#1',
    title: 'x',
    repo: 'ilken/boulevard-dex',
    kind: 'web',
    phase: 'plan',
    ciFixPushes: 0,
    cycles: 0,
    checks: [],
    pollErrors: 0,
    startedAt: 0,
    heartbeatAt: 0,
    ledger: emptyLedger(0),
  }
}

const api = (input: number, output: number, cacheRead: number, cacheWrite: number) => ({
  input_tokens: input,
  output_tokens: output,
  cache_read_input_tokens: cacheRead,
  cache_creation_input_tokens: cacheWrite,
})

describe('time split', () => {
  test('a wait overlapped by a turn counts as working', () => {
    const run = baseRun()
    run.ledger.turns = [{ startedAt: 0, endedAt: 10 * MIN }, { startedAt: 30 * MIN, endedAt: 40 * MIN }]
    run.ledger.ci = [{ startedAt: 8 * MIN, endedAt: 32 * MIN, checks: [], causes: [], fixPushes: 0, reruns: 0 }]
    const split = timeSplit(run, 60 * MIN)
    expect(split).toEqual({ wallMs: 60 * MIN, workingMs: 20 * MIN, waitingMs: 20 * MIN, idleMs: 20 * MIN })
  })

  test('the time split never passes 100% when a turn began before the run', () => {
    const run = baseRun()
    run.startedAt = 10 * MIN
    run.ledger.turns = [{ startedAt: 0, endedAt: 15 * MIN }]
    run.ledger.ci = [{ startedAt: 12 * MIN, endedAt: 20 * MIN, checks: [], causes: [], fixPushes: 0, reruns: 0 }]
    expect(timeSplit(run, 20 * MIN)).toEqual({ wallMs: 10 * MIN, workingMs: 5 * MIN, waitingMs: 5 * MIN, idleMs: 0 })
  })
})

describe('phase rows', () => {
  test('tokens, cost and model mix land on the phase they happened in', () => {
    let run = baseRun()
    run.ledger = addCost(run.ledger, 'plan', 1.0)
    run.ledger = addUsage(run.ledger, 'plan', 'claude-opus-5-5', api(100, 100, 600, 200), undefined)
    run.ledger = addCost(run.ledger, 'plan', 1.5)
    run = enterPhase(run, 'implement', 10 * MIN)
    run.ledger = addUsage(run.ledger, 'implement', 'claude-sonnet-5-5', api(100, 300, 0, 0), 'agent-1')
    run.ledger = addUsage(run.ledger, 'implement', 'claude-opus-5-5', api(100, 0, 0, 0), undefined)
    run.ledger = addCost(run.ledger, 'implement', 2.25)
    run.ledger.turns = [{ startedAt: 0, endedAt: 20 * MIN }]

    const [plan, implement] = phaseRows(run, 30 * MIN)
    expect(plan).toMatchObject({ phase: 'plan', wallMs: 10 * MIN, modelMs: 10 * MIN, tokens: 1000, costUsd: 0.5, cacheHitPct: 67 })
    expect(implement).toMatchObject({ phase: 'implement', wallMs: 20 * MIN, modelMs: 10 * MIN, tokens: 500, costUsd: 0.75 })
    expect(implement?.mix).toEqual([
      { model: 'sonnet', share: 80 },
      { model: 'opus', share: 20 },
    ])
    expect(run.ledger.subagents).toEqual(['agent-1'])
    expect(run.ledger.subagentTokens).toBe(400)
  })
})

describe('history', () => {
  test('compares against the median of the same kind and skips its own issue', () => {
    const past = (issue: string, kind: string, costUsd: number): RunSummary => ({
      issue, kind, outcome: 'green', endedAt: 0, wallMs: 100, workingMs: 50, waitingMs: 40,
      costUsd, tokens: 0, cacheHitPct: 0, ciRuns: 1, ciMs: 20, fixPushes: 0, cycles: 0,
    })
    const history = [past('#2', 'web', 2), past('#3', 'web', 4), past('#4', 'web', 6), past('#5', 'app', 100), past('#1', 'web', 50)]
    const vs = compare({ ...past('#1', 'web', 6), wallMs: 50 }, history)
    expect(vs).toEqual({ runs: 3, costPct: 50, wallPct: -50, waitingPct: 0, ciPct: 0 })
    expect(compare(past('#9', 'backend', 1), history)).toBe(undefined)
  })
})

describe('pane lines', () => {
  test('a finished run shows the ledger, causes and history', () => {
    let run = baseRun()
    run.ledger = addUsage(run.ledger, 'plan', 'claude-opus-5-5', api(1000, 1000, 0, 0), undefined)
    run = enterPhase(run, 'review', 2 * MIN)
    run = enterPhase(run, 'ci', 5 * MIN)
    run.ledger.ci = [
      {
        startedAt: 5 * MIN,
        endedAt: 20 * MIN,
        verdict: 'red',
        checks: [
          { name: 'test', bucket: 'fail', startedAt: '2026-10-09T10:00:00Z', completedAt: '2026-10-09T10:14:00Z' },
          { name: 'type-check', bucket: 'pass', startedAt: '2026-10-09T10:00:00Z', completedAt: '2026-10-09T10:00:00Z' },
        ],
        causes: ['test'],
        fixPushes: 1,
        reruns: 1,
      },
    ]
    run.ledger.searches = 4
    run.ledger.contextPeak = { plan: 85 }
    run = { ...run, endedAt: 30 * MIN, outcome: 'green' }
    const sections = runSections(run, [], 30 * MIN)
    const text = sections.map(sectionText).join('\n')
    expect(sections.map(s => s.title)).toEqual(['#1', 'Phases', 'Time', 'CI', 'Health', 'Trend'])
    expect(text).toContain(' GREEN ')
    expect(text).toContain('2k tokens')
    expect(text).toContain('Opus review')
    expect(text).toContain('✘ CI #1 15m   Red   Test 14m')
    expect(text).not.toContain('Type check 0s')
    expect(text).toContain('Caused by Test   1 fix push   ↻ 1 rerun')
    expect(text).toContain('Searches 4')
    expect(text).toContain('85% in Plan')
    expect(text).toContain('First recorded Web run')
    expect(text).not.toContain('CodeRabbit')
    expect(text).not.toContain('Done')
  })
})

describe('the hooks feed the ledger', () => {
  test('searches, reruns and history are recorded', async ($, on) => {
    mock.clock(on, { now: 1_000_000 })
    const saved: string[] = []
    on('store.get', () => ({ value: undefined }))
    on('store.set', ($, e) => {
      saved.push(JSON.stringify(e))
      return { value: undefined }
    })
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('ui.status', () => ({ value: undefined }))
    on('ui.notify', () => ({ value: { isSent: true, channel: 'terminal_bell' } }))
    on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200_000 }, rateLimits: [], cost: { usd: 3 } } }))
    on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false }, text: '' }))

    const call = (name: string, input: Record<string, unknown>) =>
      $.tool.call({ tool: `mcp__ship-cockpit__${name}`, ...input } as never)

    await call('run_start', { issue: '#1', title: 'x', repo: 'ilken/boulevard-dex', kind: 'web' })
    await call('run_update', { issue: '#1', pr: 51 })
    await call('wait', { issue: '#1', kind: 'ci' })
    await $.tool.call({ tool: 'Bash', command: 'rg -n cartTotal src' })
    await $.tool.call({ tool: 'Bash', command: 'gh run rerun 77 --failed' })

    const props = { title: 'Ship cockpit', isFocused: false, bodyColumns: 90, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as const
    for (const surface of ['terminal', 'desktop'] as const) {
      const pane = await $.ui.mount({ plugin: 'ship-cockpit', surface, component: 'Pane', props, requestId: 'ship-cockpit' })
      const drawn = JSON.stringify(await pane.drawn())
      expect(drawn).toContain('Waiting on CI')
      expect(drawn).toContain('↻ 1 rerun')
      expect(drawn).toContain('Searches')
      await pane.unmount()
    }

    await call('run_end', { issue: '#1', outcome: 'green' })
    expect(saved.join('\n')).toContain('#1')
  })
})
