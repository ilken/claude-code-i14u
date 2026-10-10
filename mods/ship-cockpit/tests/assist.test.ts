import { describe, expect, mock, test } from 'claude-code/testing'

import type { Run } from '../types'
import { failedRuns, logEvidence } from '../hooks/assist'
import { emptyLedger, escalationReason, noteMainRequest } from '../hooks/ledger'
import { runSections, sectionText } from '../hooks/view'

function baseRun(): Run {
  return {
    issue: '#1',
    title: 'x',
    repo: 'ilken/boulevard-dex',
    kind: 'web',
    phase: 'ci',
    ciFixPushes: 0,
    cycles: 0,
    checks: [],
    pollErrors: 0,
    startedAt: 0,
    heartbeatAt: 0,
    ledger: emptyLedger(0),
  }
}

const api = (input: number, cacheRead: number, cacheWrite: number) => ({
  input_tokens: input,
  output_tokens: 10,
  cache_read_input_tokens: cacheRead,
  cache_creation_input_tokens: cacheWrite,
})

describe('effort escalation', () => {
  test('fires once, only when the run is stuck', () => {
    const run = baseRun()
    expect(escalationReason({ ...run, ciFixPushes: 1 })).toBe(undefined)
    expect(escalationReason({ ...run, ciFixPushes: 2 })).toBe('CI red after 2 fix pushes')
    expect(escalationReason({ ...run, cycles: 1 })).toBe(undefined)
    expect(escalationReason({ ...run, cycles: 2 })).toBe('CI red in cycle 3')
    const escalated = { ...run, ciFixPushes: 3, ledger: { ...run.ledger, escalation: { at: 1, reason: 'x', to: 'max' as const } } }
    expect(escalationReason(escalated)).toBe(undefined)
  })

  test('records the cache hit before and after the first boosted request', () => {
    let ledger = noteMainRequest(emptyLedger(0), api(20, 980, 0), 'xhigh', false)
    expect(ledger.lastMainCachePct).toBe(98)
    ledger = { ...ledger, escalation: { at: 1, reason: 'stuck', to: 'max', cacheBeforePct: ledger.lastMainCachePct } }
    ledger = noteMainRequest(ledger, api(20, 0, 980), 'xhigh', true)
    expect(ledger.escalation).toMatchObject({ from: 'xhigh', cacheBeforePct: 98, cacheAfterPct: 0 })
    ledger = noteMainRequest(ledger, api(20, 980, 0), 'xhigh', true)
    expect(ledger.escalation?.cacheAfterPct).toBe(0)
  })

  test('the Health card shows the switch and what it did to the cache', () => {
    const run = baseRun()
    run.ledger.escalation = { at: 1, reason: 'CI red after 2 fix pushes', to: 'max', from: 'xhigh', cacheBeforePct: 98, cacheAfterPct: 97 }
    run.ledger.assists = [{ kind: 'ci-diagnosis', ms: 4000, tokens: 9000, isOk: true }]
    const text = runSections(run, [], 60_000).map(sectionText).join('\n')
    expect(text).toContain('Xhigh to Max  CI red after 2 fix pushes   cache 98% to 97%')
    expect(text).toContain('1 CI diagnosis   9k tokens · 4s')
    const steady = runSections(baseRun(), [], 60_000).map(sectionText).join('\n')
    expect(steady).toContain('Steady, cache untouched')
  })
})

describe('Haiku helpers', () => {
  test('pick the failed Actions runs', () => {
    const runs = [
      { databaseId: 11, conclusion: 'success', workflowName: 'lint' },
      { databaseId: 12, conclusion: 'failure', workflowName: 'test' },
      { databaseId: 13, conclusion: 'timed_out', name: 'e2e' },
      { databaseId: 14, conclusion: '', workflowName: 'running' },
    ]
    expect(failedRuns(runs)).toEqual([
      { id: '12', name: 'test' },
      { id: '13', name: 'e2e' },
    ])
  })

  test('log evidence keeps the tail', () => {
    const text = logEvidence('test', 'x'.repeat(10_000) + '\nFAIL src/a.test.ts:42')
    expect(text).toContain('Workflow test')
    expect(text).toContain('FAIL src/a.test.ts:42')
    expect(text.length).toBeLessThan(5_200)
  })
})

describe('the red CI wake carries the Haiku diagnosis', () => {
  test('diagnosis, escalation and assist are recorded', async ($, on) => {
    const clock = mock.clock(on, { now: 1_000_000 })
    const prompts: string[] = []
    const models: string[] = []
    on('store.get', () => ({ value: undefined }))
    on('store.set', () => ({ value: undefined }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('ui.status', () => ({ value: undefined }))
    on('ui.notify', () => ({ value: { isSent: true, channel: 'terminal_bell' } }))
    on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200_000 }, rateLimits: [] } }))
    on('prompt.submit', ($, e) => {
      prompts.push(e.text)
      return { text: e.text }
    })
    on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: '', stderr: '', interrupted: false }, text: '' }))
    on('process.run', ($, e) => {
      const [, group, verb] = e.argv
      const out = (stdout: string, exitCode = 0) => ({
        value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
      })
      if (group === 'pr' && verb === 'view') return out('{"headRefOid":"1dfb59057dc7aaaa"}')
      if (group === 'run' && verb === 'list') return out(JSON.stringify([{ databaseId: 77, conclusion: 'failure', workflowName: 'test' }]))
      if (group === 'run' && verb === 'view') return out('test\tRun yarn test\tFAIL src/cart.test.ts:88 expected 3 items, got 2')
      return out(JSON.stringify([{ name: 'test', bucket: 'fail', link: 'https://github.com/x/actions/runs/77' }]), 1)
    })
    on('model.complete', ($, e) => {
      models.push(e.model)
      return {
        value: {
          isAnswered: true,
          text: '- src/cart.test.ts:88 cart total drops the last item',
          usage: { input_tokens: 900, output_tokens: 60, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        },
      }
    })

    const call = (name: string, input: Record<string, unknown>) =>
      $.tool.call({ tool: `mcp__ship-cockpit__${name}`, ...input } as never)

    await call('run_start', { issue: '#1', title: 'x', repo: 'ilken/boulevard-dex', kind: 'web' })
    await call('run_update', { issue: '#1', pr: 51, phase: 'ci-fix' })
    await $.tool.call({ tool: 'Bash', command: 'git push' })
    await $.tool.call({ tool: 'Bash', command: 'git push' })
    await call('wait', { issue: '#1', kind: 'ci' })
    await clock.advance(180_000)

    expect(models).toEqual(['haiku'])
    expect(prompts.length).toBe(1)
    expect(prompts[0]).toContain('Haiku read the failed Actions logs')
    expect(prompts[0]).toContain('src/cart.test.ts:88 cart total drops the last item')
    expect(prompts[0]).toContain('Effort is raised to max for the rest of this run (CI red after 2 fix pushes)')

    const status = JSON.stringify((await call('status', { issue: '#1' })).result)
    expect(status).toContain('CI red after 2 fix pushes')
  })
})
