import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSheet, decide, strongestSignal, third } from '../lib/grade.js'

const ranked = (ids, explain = {}) => ids.map((id) => ({ entity_id: id, query: { affinity: 0.9, explainability: explain[id] } }))
const brands = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, name: id.toUpperCase() }))
const group = (sheet, id) => sheet.rows.find((r) => r.id === id).group

test('thirds', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((p) => third(p, 6)), [0, 0, 1, 1, 2, 2])
  assert.equal(third(0, 1), 0)
})

test('taste leads; a strong local reading lifts one step, a weak one lowers one step', () => {
  assert.equal(decide(0, null), 'stock')
  assert.equal(decide(1, null), 'consider')
  assert.equal(decide(2, null), 'skip')
  assert.equal(decide(1, 0), 'stock')
  assert.equal(decide(2, 0), 'consider')
  assert.equal(decide(0, 2), 'consider')
  assert.equal(decide(1, 2), 'skip')
  assert.equal(decide(0, 0), 'stock')
  assert.equal(decide(2, 2), 'skip')
  assert.equal(decide(1, 1), 'consider')
})

test('a missing reading never counts against a brand', () => {
  assert.equal(decide(0, null), 'stock')
  assert.equal(decide(null, 0), 'stock')
  assert.equal(decide(null, 2), 'skip')
  assert.equal(decide(null, null), 'nosignal')
})

test('a brand missing from the city answer keeps its taste group (the Austin case)', () => {
  // taste knows all six; the city answer only returns three of them
  const sheet = buildSheet({ brands, byTaste: ranked(['a', 'b', 'c', 'd', 'e', 'f']), byPlace: ranked(['e', 'f', 'd']), signalNames: { s: 'Bad Bunny' }, city: 'Austin' })
  assert.equal(group(sheet, 'a'), 'stock')
  assert.equal(group(sheet, 'b'), 'stock')
  assert.equal(group(sheet, 'c'), 'consider')
  assert.equal(group(sheet, 'e'), 'consider') // bottom on taste, lifted by a top local reading
  assert.match(sheet.rows.find((r) => r.id === 'a').reasons.at(-1), /no local reading .* does not count against it/)
  assert.deepEqual(sheet.read, { taste: 6, place: 3, of: 6 })
})

test('with only a city, brands the city answer lacks are "no signal", never "skip"', () => {
  const sheet = buildSheet({ brands, byTaste: [], byPlace: ranked(['c', 'a', 'b']), signalNames: {}, city: 'Denver' })
  assert.deepEqual(['c', 'a', 'b'].map((id) => group(sheet, id)), ['stock', 'consider', 'skip'])
  assert.equal(group(sheet, 'd'), 'nosignal')
  assert.equal(sheet.counts.nosignal, 3)
  assert.equal(sheet.rows.find((r) => r.id === 'd').reasons.at(-1), 'With no reading at all, this brand is left unjudged.')
})

test('with only taste, no place sentence is written', () => {
  const sheet = buildSheet({ brands: brands.slice(0, 3), byTaste: ranked(['a', 'b', 'c']), byPlace: [], signalNames: { s: 'Aesop' }, city: '' })
  assert.deepEqual(sheet.rows[0].reasons, ['Taste: 1st of 3 brands on this list among fans of what your customers love.'])
})

test('rows are ordered stock, consider, skip, no signal, then by position', () => {
  const sheet = buildSheet({ brands, byTaste: ranked(['f', 'e', 'd', 'c']), byPlace: [], signalNames: { s: 'X' }, city: '' })
  assert.deepEqual(sheet.rows.map((r) => r.id), ['f', 'e', 'd', 'c', 'a', 'b'])
  assert.deepEqual(sheet.rows.map((r) => r.group), ['stock', 'stock', 'consider', 'skip', 'nosignal', 'nosignal'])
})

test('reasons give the position, the strongest signal and the local reading', () => {
  const explain = { a: { 'signal.interests.entities': [{ entity_id: 's1', score: 0.75 }, { entity_id: 's2', score: 0.25 }] } }
  const sheet = buildSheet({
    brands: brands.slice(0, 2), byTaste: ranked(['a', 'b'], explain), byPlace: ranked(['b']),
    signalNames: { s1: 'Tyler Childers', s2: 'Carhartt' }, city: 'Denver',
  })
  assert.deepEqual(sheet.rows.find((r) => r.id === 'a').reasons, [
    'Taste: 1st of 2 brands on this list among fans of what your customers love.',
    'The strongest link is to fans of Tyler Childers (75% of the match).',
    'Place: Qloo has no local reading for this brand in Denver. That is missing data and does not count against it.',
  ])
  assert.equal(sheet.rows.find((r) => r.id === 'b').reasons.at(-1), 'Place: 1st of the 1 brands on this list that Qloo has a local reading for in Denver.')
})

test('results for brands that are not on the list are ignored', () => {
  const sheet = buildSheet({ brands: brands.slice(0, 2), byTaste: ranked(['zzz', 'a', 'b']), byPlace: [], signalNames: { s: 'X' }, city: '' })
  assert.equal(sheet.rows.find((r) => r.id === 'a').taste, 1)
  assert.equal(sheet.read.taste, 2)
})

test('strongest signal ignores contributions that are not one of the shop\'s signals', () => {
  const e = { 'signal.interests.entities': [{ entity_id: 'other', score: 0.9 }, { entity_id: 's1', score: 0.1 }] }
  assert.deepEqual(strongestSignal(e, { s1: 'Aesop' }), { name: 'Aesop', share: 100 })
  assert.equal(strongestSignal(undefined, { s1: 'Aesop' }), null)
  assert.equal(strongestSignal(e, {}), null)
})

test('ordinals read correctly', () => {
  const many = Array.from({ length: 23 }, (_, i) => ({ id: `x${i}`, name: `X${i}` }))
  const sheet = buildSheet({ brands: many, byTaste: ranked(many.map((b) => b.id)), byPlace: [], signalNames: { s: 'X' }, city: '' })
  const word = (n) => sheet.rows.find((r) => r.taste === n).reasons[0].split(' ')[1]
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23].map(word), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd'])
})
