import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeDrop, encodeDrop } from '../lib/share.js'

const drop = {
  number: 3,
  title: 'Denver, Colorado, for fans of Patagonia',
  city: 'Denver, Colorado',
  sheet: { rows: [
    { id: '1', name: 'Fjällräven', group: 'stock', reasons: ['secret'] },
    { id: '2', name: 'Baggu', group: 'skip', reasons: [] },
    { id: '3', name: 'Le Labo', group: 'consider', reasons: [] },
  ] },
}

test('a drop survives the round trip, accents included, without its reasons', () => {
  const code = encodeDrop(drop)
  assert.match(code, /^[A-Za-z0-9_-]+$/)
  const back = decodeDrop(code)
  assert.equal(back.title, drop.title)
  assert.equal(back.number, 3)
  assert.deepEqual(back.sheet.rows.map((r) => [r.name, r.group]), [['Fjällräven', 'stock'], ['Le Labo', 'consider'], ['Baggu', 'skip']])
  assert.deepEqual(back.sheet.counts, { stock: 1, consider: 1, skip: 1, nosignal: 0 })
  assert.ok(back.sheet.rows.every((r) => r.reasons.length === 0))
})

test('junk codes are refused, not trusted', () => {
  for (const bad of ['', 'not a code!', 'aGVsbG8', 'x'.repeat(4000), btoa('{"v":2,"g":[]}'), btoa('{"v":1,"g":[[],[],[],[]]}')]) {
    assert.equal(decodeDrop(bad), null, bad.slice(0, 20))
  }
})

test('oversized names and numbers are trimmed', () => {
  const code = Buffer.from(JSON.stringify({ v: 1, n: 99999, t: 'x'.repeat(500), c: 5, g: [['y'.repeat(200)], [], [], []] })).toString('base64url')
  const d = decodeDrop(code)
  assert.equal(d.number, 1)
  assert.equal(d.title.length, 140)
  assert.equal(d.city, '')
  assert.equal(d.sheet.rows[0].name.length, 60)
})
