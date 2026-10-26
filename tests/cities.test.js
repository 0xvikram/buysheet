import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES, cityText, readCities } from '../lib/cities.js'

const at = (name, affinity) => ({ name, lat: 0, lon: 0, affinity })

test('cities are ranked against each other in thirds, best first', () => {
  const rows = readCities([at('A', 0.98), at('B', 0.999), at('C', 0.95), at('D', 0.97), at('E', 0.996), at('F', 0.99)])
  assert.deepEqual(rows.map((r) => [r.name, r.rank, r.fit]), [
    ['B', 1, 'strong'], ['E', 2, 'strong'], ['F', 3, 'fair'], ['A', 4, 'fair'], ['D', 5, 'weak'], ['C', 6, 'weak'],
  ])
})

test('a city without a reading is "no local data", never weak, and goes last', () => {
  const rows = readCities([at('Miami', null), at('Seattle', 0.999), at('Atlanta', 0.98), at('Denver', 0.99)])
  assert.deepEqual(rows.at(-1), { name: 'Miami', lat: 0, lon: 0, affinity: null, rank: null, fit: 'none' })
  assert.match(cityText('Filson', rows), /^Filson fits best in Seattle\. Weakest in Atlanta\. No local data for Miami\.$/)
})

test('no readings at all says so', () => {
  assert.match(cityText('Kapital', readCities([at('A', null)])), /no local readings/)
})

test('the city list has coordinates inside the lower 48', () => {
  assert.equal(CITIES.length, 12)
  assert.ok(CITIES.every((c) => c.lat > 24 && c.lat < 50 && c.lon > -125 && c.lon < -66))
})
