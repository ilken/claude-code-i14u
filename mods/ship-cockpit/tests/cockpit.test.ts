import { describe, expect, mock, test } from 'claude-code/testing'

import { bashDenial, ciVerdict, countPush, isRerun, isRunPush, isSearchCommand, prFrom, runPrFrom, splitSegments } from '../hooks/logic'

const run = { phase: 'ci' as const, ciFixPushes: 0, cycles: 0, pr: 12, repo: 'ilken/boulevard-dex' }

describe('guard rules', () => {
  test('nothing is denied outside a run', () => {
    expect(bashDenial('gh pr merge 12 --squash', undefined)).toBe(undefined)
  })

  test('hard rules are denied inside a run', () => {
    expect(bashDenial('gh pr merge 12 --squash', run)).toContain('never merges')
    expect(bashDenial('gh pr review 12 --approve', run)).toContain('APPROVE')
    expect(bashDenial('git push origin main', run)).toContain('main or master')
    expect(bashDenial('git push origin HEAD:master', run)).toContain('main or master')
    expect(bashDenial('cd /repo && git -C /repo push --force origin ilken/1-x', run)).toContain('force')
    expect(bashDenial('git push -f', run)).toContain('force')
    expect(bashDenial('git push origin +ilken/1-x', run)).toContain('force')
  })

  test('ordinary work passes', () => {
    expect(bashDenial('git push --force-with-lease origin ilken/1-main-fix', run)).toBe(undefined)
    expect(bashDenial('git push -u origin ilken/1-x', run)).toBe(undefined)
    expect(bashDenial('git commit -m "do not gh pr merge && git push origin main"', run)).toBe(undefined)
    expect(bashDenial('gh pr review 12 --comment -b "ok"', run)).toBe(undefined)
    expect(bashDenial('yarn test 2>&1 | tail -5', run)).toBe(undefined)
  })

  test('config learnings still merge and do not count against the caps', () => {
    const atCap = { ...run, phase: 'review-fix' as const, cycles: 5 }
    expect(bashDenial('gh pr merge 7 --repo ilken/claude-code-i14u --squash --delete-branch', atCap)).toBe(undefined)
    expect(bashDenial('gh pr merge https://github.com/ilken/boulevard-dex/pull/12', run)).toContain('never merges')
    expect(bashDenial('git -C ~/Developer/claude-code-i14u push -u origin ilken/learning', atCap)).toBe(undefined)
    expect(bashDenial('cd ~/Developer/claude-code-i14u && git push', atCap)).toBe(undefined)
    expect(bashDenial('git -C ~/Developer/claude-code-i14u push origin main', atCap)).toContain('main or master')
    expect(isRunPush('git -C ~/Developer/claude-code-i14u push')).toBe(false)
    expect(isRunPush('git add -A && git push')).toBe(true)
  })

  test('the sixth push in a phase is denied', () => {
    expect(bashDenial('git push', { ...run, phase: 'ci-fix', ciFixPushes: 4 })).toBe(undefined)
    expect(bashDenial('git push', { ...run, phase: 'ci-fix', ciFixPushes: 5 })).toContain('CI-fix pushes')
    expect(bashDenial('git push', { ...run, phase: 'review-fix', cycles: 5 })).toContain('review cycles')
    expect(countPush({ ...run, phase: 'ci-fix' }).ciFixPushes).toBe(1)
    expect(countPush({ ...run, phase: 'loop' }).cycles).toBe(1)
    expect(countPush({ ...run, phase: 'pr' })).toEqual({ ...run, phase: 'pr' })
  })

  test('segments split on operators but not inside quotes', () => {
    expect(splitSegments('a && b; c | d')).toEqual(['a', 'b', 'c', 'd'])
    expect(splitSegments('git commit -m "x && y"')).toEqual(['git commit -m "x && y"'])
  })

  test('searches and reruns are recognised', () => {
    expect(isSearchCommand('rg -n foo src && cat x')).toBe(true)
    expect(isSearchCommand('git grep foo')).toBe(true)
    expect(isSearchCommand('echo "grep me"')).toBe(false)
    expect(isRerun('gh run rerun 123 --failed')).toBe(true)
    expect(isRerun('gh run view 123 --log-failed')).toBe(false)
  })
})

describe('ci verdict', () => {
  const pass = { name: 'lint', bucket: 'pass' }
  test('waits through the grace and while anything runs', () => {
    expect(ciVerdict([pass], 30_000)).toBe('pending')
    expect(ciVerdict([], 240_000)).toBe('pending')
    expect(ciVerdict([pass, { name: 'tests', bucket: 'pending' }], 600_000)).toBe('pending')
  })
  test('missing when no check has appeared five minutes in', () => {
    expect(ciVerdict([], 300_000)).toBe('missing')
    expect(ciVerdict([pass], 300_000)).toBe('green')
  })
  test('red on a failure, green when all pass', () => {
    expect(ciVerdict([pass, { name: 'tests', bucket: 'fail' }], 600_000)).toBe('red')
    expect(ciVerdict([pass, { name: 'e2e', bucket: 'skipping' }], 600_000)).toBe('green')
  })
  test('reads the PR off gh pr create output', () => {
    expect(prFrom('Creating pull request\nhttps://github.com/ilken/boulevard-dex/pull/51\n')).toEqual({
      url: 'https://github.com/ilken/boulevard-dex/pull/51',
      repo: 'ilken/boulevard-dex',
      number: 51,
    })
  })
  test('a PR created in another repo is not the run PR', () => {
    const config = 'https://github.com/ilken/claude-code-i14u/pull/9'
    expect(runPrFrom('gh pr create --fill', config, 'ilken/boulevard-dex')).toBe(undefined)
    expect(runPrFrom('gh pr create --fill', config, 'ILKEN/claude-code-i14u')?.number).toBe(9)
    expect(runPrFrom('gh pr view 9', config, 'ilken/claude-code-i14u')).toBe(undefined)
  })
})

describe('a run end to end', () => {
  test('guards, tracks the PR, and wakes the session on missing, red and green CI', async ($, on) => {
    const clock = mock.clock(on, { now: 1_000_000 })
    const prompts: string[] = []
    let checksJson = '[]'

    on('tool.call', { tool: 'Bash' }, ($, e) => {
      const repo = e.command.includes('claude-code-i14u') ? 'claude-code-i14u/pull/9' : 'boulevard-dex/pull/51'
      const out = e.command.startsWith('gh pr create') ? `https://github.com/ilken/${repo}` : ''
      return { result: { stdout: out, stderr: '', interrupted: false }, text: out }
    })
    on('process.run', ($, e) => ({
      value: {
        exitCode: 1,
        stdout: e.argv[0] === 'gh' && e.argv[2] === 'checks' ? checksJson : '',
        stderr: '',
        isStdoutTruncated: false,
        isStderrTruncated: false,
      },
    }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('ui.status', () => ({ value: undefined }))
    on('ui.notify', () => ({ value: { isSent: true, channel: 'terminal_bell' } }))
    on('prompt.submit', ($, e) => {
      prompts.push(e.text)
      return { text: e.text }
    })

    const call = (name: string, input: Record<string, unknown>) =>
      $.tool.call({ tool: `mcp__ship-cockpit__${name}`, ...input } as never)

    await call('run_start', { issue: '#1', title: 'x', repo: 'ilken/boulevard-dex', kind: 'web' })

    await $.tool.call({ tool: 'Bash', command: 'gh pr create --fill' })
    const status = await call('status', { issue: '#1' })
    expect(JSON.stringify(status.result)).toContain('51')

    const merge = await $.tool.call({ tool: 'Bash', command: 'gh pr merge 51 --squash' })
    expect(JSON.stringify(merge)).toContain('never merges')

    await $.tool.call({ tool: 'Bash', command: 'gh pr create --repo ilken/claude-code-i14u --fill' })
    const configMerge = await $.tool.call({ tool: 'Bash', command: 'gh pr merge 9 --squash' })
    expect(JSON.stringify(configMerge)).not.toContain('never merges')

    const badWait = await call('wait', { issue: '#1', kind: 'coderabbit' })
    expect(JSON.stringify(badWait.result)).toContain('kind must be ci')

    await call('wait', { issue: '#1', kind: 'ci' })
    await clock.advance(240_000)
    expect(prompts.length).toBe(0)
    await clock.advance(60_000)
    expect(prompts.length).toBe(1)
    expect(prompts[0]).toContain('no CI run exists for PR #51')
    expect(prompts[0]).toContain('Treat it as no CI')

    await call('wait', { issue: '#1', kind: 'ci' })
    checksJson = JSON.stringify([
      { name: 'lint', bucket: 'pass' },
      { name: 'test', bucket: 'fail', link: 'https://github.com/ilken/boulevard-dex/actions/runs/1' },
    ])
    await clock.advance(180_000)
    expect(prompts.length).toBe(2)
    expect(prompts[1]).toContain('CI is red on PR #51')
    expect(prompts[1]).toContain('test')

    await call('wait', { issue: '#1', kind: 'ci' })
    checksJson = JSON.stringify([{ name: 'lint', bucket: 'pass' }, { name: 'test', bucket: 'pass' }])
    await clock.advance(180_000)
    expect(prompts.length).toBe(3)
    expect(prompts[2]).toContain('CI is green on PR #51')
    expect(prompts[2]).toContain('Phase 5')
  })
})
