import test from 'node:test'
import assert from 'node:assert/strict'
import { popularityBaseline } from '../lib/baseline.js'
import { describeLean, list } from '../lib/words.js'

const rows = [
  { id: 'a', name: 'A', group: 'stock' }, { id: 'b', name: 'B', group: 'consider' },
  { id: 'c', name: 'C', group: 'skip' }, { id: 'd', name: 'D', group: 'nosignal' },
]

test('the generic list ranks by popularity alone, in thirds', () => {
  const b = popularityBaseline(rows, { a: 0.5, b: 0.7, c: 0.99, d: 1 })
  assert.deepEqual(b.generic, { c: 'stock', b: 'consider', a: 'skip' })
  assert.equal(b.compared, 3) // D has no reading for the shop, so it is not compared
  assert.equal(b.same, 1)
  assert.deepEqual(b.flips.map((f) => f.name).sort(), ['A', 'C'])
})

test('brands without a popularity figure are left out', () => {
  assert.equal(popularityBaseline(rows, { a: 0.5 }).compared, 1)
})

test('lists read naturally', () => {
  assert.equal(list(['A']), 'A')
  assert.equal(list(['A', 'B']), 'A and B')
  assert.equal(list(['A', 'B', 'C']), 'A, B and C')
})

test('audience lean names only clear leans', () => {
  const topo = { age: { '24_and_younger': -0.02, '45_to_54': 0.59, '55_and_older': -0.82, '30_to_34': -0.63 }, gender: { male: 0.31, female: -0.31 } }
  assert.equal(describeLean(topo), 'The audience leans 45 to 54 and leans male, and is light on people 55 and over and 30 to 34.')
  assert.equal(describeLean({ age: { '25_to_29': 0.1 }, gender: { male: 0.05 } }), 'The audience is broad, with no clear age or gender lean.')
  assert.equal(describeLean(undefined), 'Qloo has no audience reading for this brand.')
})
