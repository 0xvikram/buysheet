import test from 'node:test'
import assert from 'node:assert/strict'
import { freshState, respond } from '../lib/agent.js'

test('each conversation gets its own lists, so one shop never sees another', () => {
  const a = freshState({})
  a.list.push({ id: 'x', name: 'Filson' })
  a.pending.push({ typed: 'Kapital' })
  const b = freshState({})
  assert.deepEqual([b.list, b.pending, b.loves, b.skipped], [[], [], [], []])
})

test('incoming state is copied, not changed in place', () => {
  const incoming = { list: [{ id: 'x', name: 'Filson' }] }
  const s = freshState(incoming)
  s.list.push({ id: 'y', name: 'Baggu' })
  assert.equal(incoming.list.length, 1)
})

test('rubbish state is replaced with an empty one', () => {
  const s = freshState({ list: 'nope', pending: 3 })
  assert.deepEqual([s.list, s.pending], [[], []])
})

test('help and unclear messages need no network', async () => {
  const hi = await respond('hi', {})
  assert.match(hi.replies[0].text, /buying agent/)
  const odd = await respond('blue elephants', {})
  assert.match(odd.replies[0].text, /can't answer that one/)
})

test('asking why before any drop explains what to do', async () => {
  const r = await respond('why skip Baggu?', {})
  assert.match(r.replies[0].text, /isn't on your latest drop|Which brand/)
})
