import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cleanWorkspace, counts, dropRecord, initials, overview, positions, sampleWorkspace, searchBrands, setupMessage, toCsv, upsertDrop } from '../lib/workspace.js'

const row = (id, name, group, reasons = []) => ({ id, name, group, reasons })
const drop = (number, rows, extra = {}) => ({ number, title: 'Denver', city: 'Denver', sheet: { rows }, baseline: { flips: [] }, ...extra })

test('broken or old storage becomes an empty workspace, not a crash', () => {
  for (const bad of [null, 'x', { v: 1, drops: [1] }, { v: 2, drops: [{ nope: 1 }], shop: { name: 5 } }]) {
    const w = cleanWorkspace(bad)
    assert.deepEqual([w.shop, w.drops, w.agent.messages], [null, [], []])
  }
})

test('drop records get sensible names and replace by number', () => {
  const a = dropRecord(drop(1, []))
  assert.equal(a.name, 'Order #01')
  assert.equal(dropRecord(drop(2, [], { whatIf: true, city: 'Austin' })).name, 'What-if: Austin')
  const list = upsertDrop(upsertDrop([], a), { ...a, name: 'Spring order' })
  assert.deepEqual(list.map((d) => d.name), ['Spring order'])
})

test('overview counts reviews and agreement from the owner\'s own calls only', () => {
  const rec = dropRecord(drop(1, [row('a', 'Filson', 'stock'), row('b', 'Baggu', 'skip'), row('c', 'Aesop', 'consider'), row('d', 'X', 'nosignal')], { baseline: { flips: [{ name: 'Baggu' }] } }))
  rec.calls = { a: 'stock', b: 'stock' }
  const o = overview({ drops: [rec] })
  assert.deepEqual(o, { drops: 1, brands: 3, reviewed: 2, agreement: 50, flips: 1, calls: 0 })
  assert.equal(overview({ drops: [] }).agreement, null)
  assert.deepEqual(counts(rec.drop), { stock: 1, consider: 1, skip: 1, nosignal: 1 })
})

test('search finds brands across drops, newest first, with the final call', () => {
  const one = dropRecord(drop(1, [row('a', 'Filson', 'stock')]))
  const two = dropRecord(drop(2, [row('a', 'Filson', 'skip'), row('b', 'Fjällräven', 'stock')]))
  two.calls = { a: 'consider' }
  assert.deepEqual(searchBrands({ drops: [one, two] }, 'fil').map((x) => [x.number, x.group]), [[2, 'consider'], [1, 'stock']])
  assert.deepEqual(searchBrands({ drops: [one] }, '  '), [])
})

test('CSV quotes commas and quotes and keeps both calls', () => {
  const rec = dropRecord(drop(1, [row('a', 'Herschel, Co', 'stock', ['Taste: 1st of 3 "top"'])]))
  rec.calls = { a: 'skip' }
  assert.equal(toCsv(rec), 'Brand,Agent,Your call,Reasons\n"Herschel, Co",stock,skip,"Taste: 1st of 3 ""top"""')
})

test('positions are read from the reasons the grader writes', () => {
  const p = positions(row('a', 'Baggu', 'skip', ['Taste: 17th of 23 brands on this list.', 'Place: 15th of the 21 brands on this list that Qloo has a local reading for in Denver.']))
  assert.deepEqual(p, { taste: { at: 17, of: 23 }, place: { at: 15, of: 21 } })
  assert.deepEqual(positions(row('b', 'X', 'stock', [])), { taste: null, place: null })
})

test('the setup message is one the agent parses', () => {
  assert.equal(setupMessage({ city: 'Denver, Colorado', loves: ['Patagonia', 'Carhartt'], list: 'Baggu\nFilson\n' }), 'My shop is in Denver, Colorado. My customers love Patagonia, Carhartt.\nBaggu\nFilson')
})

test('the sample workspace is built from the real recorded example', () => {
  const ex = JSON.parse(readFileSync(new URL('../public/examples/denver.json', import.meta.url)))
  const w = sampleWorkspace(ex, { name: 'Mile High Goods', city: 'Denver, Colorado', kind: 'Gift shop', loves: [] })
  assert.equal(w.drops[0].name, 'Spring order')
  assert.ok(w.drops.some((d) => d.drop.whatIf))
  assert.ok(w.maps.length >= 1)
  assert.equal(initials(w.shop.name), 'MH')
})
