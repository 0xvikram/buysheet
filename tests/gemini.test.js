import test from 'node:test'
import assert from 'node:assert/strict'
import { compare } from '../lib/gemini.js'

const rows = [
  { name: 'A', group: 'stock' }, { name: 'B', group: 'skip' }, { name: 'C', group: 'consider' },
  { name: 'D', group: 'nosignal' }, { name: 'E', group: 'skip' },
]

test('agreement is counted only where both sides gave a verdict', () => {
  const c = compare(rows, { stock: ['A', 'E'], consider: ['C', 'D'], skip: ['B'] })
  assert.equal(c.compared, 4) // D has no Qloo signal, so it is left out
  assert.equal(c.same, 3)
})

test('stock against skip is flagged as an opposite call', () => {
  const c = compare(rows, { stock: ['A', 'E'], consider: ['C'], skip: ['B'] })
  assert.deepEqual(c.opposite, [{ name: 'E', qloo: 'skip', plain: 'stock' }])
})

test('stock against consider is a difference but not an opposite', () => {
  const c = compare(rows, { stock: ['C'], consider: ['A'], skip: ['B', 'E'] })
  assert.equal(c.same, 2)
  assert.deepEqual(c.opposite, [])
})

test('brands the plain guess left out are not compared', () => {
  assert.equal(compare(rows, { stock: ['A'], consider: [], skip: [] }).compared, 1)
})
