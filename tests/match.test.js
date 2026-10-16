import test from 'node:test'
import assert from 'node:assert/strict'
import { judgeMatch, normalize, parseList } from '../lib/match.js'

const entity = (name, about = '') => ({ entity_id: `id-${name}`, name, types: ['urn:entity:brand'], properties: { short_description: about } })

test('names compare without accents, case or punctuation', () => {
  assert.equal(normalize('Fjällräven'), normalize('fjallraven'))
  assert.equal(normalize("Arc'teryx"), 'arcteryx')
  assert.equal(normalize('Rifle Paper Co.'), 'riflepaperco')
  assert.equal(normalize('H&M'), 'handm')
})

test('a pasted list is split, trimmed and de-duplicated', () => {
  assert.deepEqual(parseList('Baggu\n- Le Labo\n2. Aesop, baggu;  \n\nStanley'), ['Baggu', 'Le Labo', 'Aesop', 'Stanley'])
})

test('a list is capped at 60 names', () => {
  assert.equal(parseList(Array.from({ length: 80 }, (_, i) => `Brand ${i}`).join('\n')).length, 60)
})

test('the same name is used without asking', () => {
  const m = judgeMatch('Stüssy', [entity('Stüssy'), entity('Stussy Kids')])
  assert.equal(m.state, 'matched')
  assert.equal(m.pick.name, 'Stüssy')
})

test('a partial name match must be confirmed by the owner', () => {
  const m = judgeMatch('Kapital', [entity('Kapital Bank', 'A commercial bank in Azerbaijan')])
  assert.equal(m.state, 'check')
  assert.equal(m.pick.name, 'Kapital Bank')
  assert.equal(m.options[0].about, 'A commercial bank in Azerbaijan')
})

test('unrelated results are never guessed', () => {
  const m = judgeMatch('Earl of East', [entity('University of East Anglia')])
  assert.equal(m.state, 'unknown')
  assert.equal(m.pick, null)
})

test('no results is unknown', () => {
  assert.equal(judgeMatch('Graza', []).state, 'unknown')
})

test('long descriptions are shortened', () => {
  const m = judgeMatch('X', [entity('X', 'a'.repeat(200))])
  assert.ok(m.pick.about.length <= 110)
})
