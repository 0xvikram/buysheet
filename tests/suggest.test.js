import test from 'node:test'
import assert from 'node:assert/strict'
import { loveOptions, placeLabel, placeOptions } from '../lib/suggest.js'

test('place labels keep the city, its region and a short country', () => {
  assert.equal(placeLabel('Austin', 'Austin, Travis, Texas, United States of America'), 'Austin, Texas, US')
  assert.equal(placeLabel('London', 'London, Inner London - East, Greater London, England, United Kingdom'), 'London, England, UK')
  assert.equal(placeLabel('Denver', 'Denver, Colorado, United States of America'), 'Denver, Colorado, US')
  assert.equal(placeLabel('Paris', 'Paris, France'), 'Paris, France')
  assert.equal(placeLabel('Tokyo', ''), 'Tokyo')
})

test('places are de-duplicated and capped', () => {
  const r = [
    { name: 'Mumbai', disambiguation: 'Mumbai, Maharashtra, India' },
    { name: 'Mumbai', disambiguation: 'Mumbai, Maharashtra, India' },
    { name: 'Navi Mumbai', disambiguation: 'Navi Mumbai, Thane District, Maharashtra, India' },
  ]
  assert.deepEqual(placeOptions(r).map((x) => x.label), ['Mumbai, Maharashtra, India', 'Navi Mumbai, Maharashtra, India'])
})

test('loves are typed, popular first, and obscure matches dropped', () => {
  const r = [
    { name: 'Tyler', types: ['urn:entity:movie'], popularity: 0 },
    { name: 'Tyler Bates', types: ['urn:entity:artist'], popularity: 0.99 },
    { name: 'Tyler, the Creator', types: ['urn:entity:artist'], popularity: 1, properties: { short_description: 'American rapper' } },
  ]
  assert.deepEqual(loveOptions(r).map((x) => `${x.name} · ${x.type}`), ['Tyler, the Creator · Artist', 'Tyler Bates · Artist'])
  assert.equal(loveOptions(r)[0].about, 'American rapper')
})
