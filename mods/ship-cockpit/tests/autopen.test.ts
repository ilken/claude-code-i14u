import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const typed = { kind: 'composer' } as const
const presentation = { isFullscreen: true, columns: 100 }
const command = (name: string) => ({ command: name, args: '#1', origin: typed, presentation })
const prompt = (text: string) => ({ text, wait: false, origin: typed })

function world(on: On) {
  const opened: string[] = []
  on('store.get', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.open', ($, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('command.run', () => ({ text: '' }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  return opened
}

test('typing /mod:ship opens the pane before the run starts', async ($, on) => {
  const opened = world(on)
  await $.command.run(command('mod:ship'))
  expect(opened).toEqual(['ship-cockpit'])
})

test('a /mod:ship prompt opens it too, other prompts and commands do not', async ($, on) => {
  const opened = world(on)
  await $.prompt.submit(prompt('/mod:ship #1'))
  await $.prompt.submit(prompt('what is /mod:ship for?'))
  await $.command.run(command('ship'))
  expect(opened).toEqual(['ship-cockpit'])
})
