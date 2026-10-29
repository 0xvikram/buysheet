import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareCrowds } from '../lib/crowds.js'

const drop = (rows, generic = {}) => ({ sheet: { rows }, baseline: { generic } })
const row = (id, name, group) => ({ id, name, group })

test('brands whose call changes across shops are counted and listed first', () => {
  const a = drop([row('1', 'Filson', 'stock'), row('2', 'Baggu', 'skip'), row('3', 'Aesop', 'consider')], { 1: 'consider', 2: 'stock', 3: 'skip' })
  const b = drop([row('1', 'Filson', 'skip'), row('2', 'Baggu', 'skip'), row('3', 'Aesop', 'consider')])
  const r = compareCrowds([{ id: 'den', drop: a }, { id: 'la', drop: b }])
  assert.deepEqual([r.changed, r.total], [1, 3])
  assert.deepEqual(r.brands[0], { name: 'Filson', generic: 'consider', calls: { den: 'stock', la: 'skip' }, distinct: 2 })
})

test('a brand missing or without a reading in any shop is left out', () => {
  const a = drop([row('1', 'Filson', 'stock'), row('2', 'Baggu', 'nosignal')])
  const b = drop([row('1', 'Filson', 'stock')])
  assert.deepEqual(compareCrowds([{ id: 'a', drop: a }, { id: 'b', drop: b }]).brands.map((x) => x.name), ['Filson'])
})

test('on the recorded sample shops the calls really do differ by crowd', () => {
  const load = (id) => JSON.parse(readFileSync(new URL(`../public/examples/${id}.json`, import.meta.url))).turns.flatMap((t) => t.replies).find((r) => r.type === 'drop').drop
  const r = compareCrowds(['austin', 'portland', 'nashville', 'losangeles'].map((id) => ({ id, drop: load(id) })))
  assert.ok(r.total >= 15)
  assert.ok(r.changed >= 5, `only ${r.changed} changed`)
})
