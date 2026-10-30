import test from 'node:test'
import assert from 'node:assert/strict'
import { extractList, parse, splitNames } from '../lib/intent.js'

test('names split on commas, "and", ampersands and slashes', () => {
  assert.deepEqual(splitNames('Patagonia, Carhartt and Tyler Childers.'), ['Patagonia', 'Carhartt', 'Tyler Childers'])
  assert.deepEqual(splitNames('Le Labo & Aesop / Glossier'), ['Le Labo', 'Aesop', 'Glossier'])
})

test('a pasted list is pulled out of the prose', () => {
  const { names, rest } = extractList('Here is my order\nBaggu\n- Le Labo\n3. Topo Designs\nFilson')
  assert.deepEqual(names, ['Baggu', 'Le Labo', 'Topo Designs', 'Filson'])
  assert.equal(rest, 'Here is my order')
  assert.deepEqual(extractList('Sort these: Baggu, Aesop, Filson').names, ['Baggu', 'Aesop', 'Filson'])
  assert.deepEqual(extractList('just two: Baggu, Aesop').names, [])
})

test('the classic opening message gives place, favourites and a list', () => {
  const p = parse('I run a gift shop in Denver, Colorado. My customers love Patagonia, Carhartt and Tyler Childers.\nBaggu\nFilson\nTopo Designs\nAesop')
  assert.equal(p.intent, 'setup')
  assert.equal(p.city, 'Denver, Colorado')
  assert.deepEqual(p.loves, ['Patagonia', 'Carhartt', 'Tyler Childers'])
  assert.deepEqual(p.names, ['Baggu', 'Filson', 'Topo Designs', 'Aesop'])
})

test('place and favourites can come separately', () => {
  assert.deepEqual(parse("We're based in Brooklyn").city, 'Brooklyn')
  assert.deepEqual(parse('Our regulars are into Glossier and Phoebe Bridgers').loves, ['Glossier', 'Phoebe Bridgers'])
  assert.equal(parse('My store is in Austin, Texas and my crowd loves Bad Bunny').city, 'Austin, Texas')
  assert.deepEqual(parse('My store is in Austin, Texas and my crowd loves Bad Bunny').loves, ['Bad Bunny'])
})

test('yes and no answer a pending question, but only when one is pending', () => {
  const pending = { pending: [{ typed: 'Kapital' }] }
  assert.deepEqual(parse("Yes, that's it", pending), { intent: 'answer', yes: true })
  assert.deepEqual(parse('nope', pending), { intent: 'answer', yes: false })
  assert.notEqual(parse('yes').intent, 'answer')
})

test('what-if questions name the other city', () => {
  assert.deepEqual(parse('What if I opened in Austin?'), { intent: 'whatif', city: 'Austin' })
  assert.deepEqual(parse("what if we moved to Portland, Oregon"), { intent: 'whatif', city: 'Portland, Oregon' })
  assert.deepEqual(parse('Thinking of opening a second store in Miami'), { intent: 'whatif', city: 'Miami' })
})

test('comparisons in their common forms', () => {
  assert.deepEqual(parse('Snow Peak vs Cotopaxi'), { intent: 'compare', a: 'Snow Peak', b: 'Cotopaxi' })
  assert.deepEqual(parse('compare Filson and Danner'), { intent: 'compare', a: 'Filson', b: 'Danner' })
  assert.deepEqual(parse('Is Snow Peak or Cotopaxi a better fit?'), { intent: 'compare', a: 'Snow Peak', b: 'Cotopaxi' })
  assert.deepEqual(parse('Should I stock Baggu or Herschel?'), { intent: 'compare', a: 'Baggu', b: 'Herschel' })
})

test('audience questions', () => {
  assert.deepEqual(parse('Who buys Topo Designs?'), { intent: 'audience', name: 'Topo Designs' })
  assert.deepEqual(parse('audience for Le Labo'), { intent: 'audience', name: 'Le Labo' })
})

test('discovery questions', () => {
  assert.deepEqual(parse('Find me brands like Filson'), { intent: 'similar', names: ['Filson'] })
  assert.deepEqual(parse('anything similar to Baggu and Aesop?'), { intent: 'similar', names: ['Baggu', 'Aesop'] })
  assert.deepEqual(parse('Suggest some new brands for my crowd'), { intent: 'similar', names: [] })
})

test('why questions find the brand in the last drop, even inside a longer sentence', () => {
  const state = { drop: { sheet: { rows: [{ id: '1', name: 'Le Labo' }, { id: '2', name: 'Baggu' }] } } }
  assert.equal(parse('why did you skip Baggu?', state).brand.name, 'Baggu')
  assert.equal(parse('Why is Le Labo only a consider', state).brand.name, 'Le Labo')
  assert.deepEqual(parse('why skip Faherty?', state), { intent: 'explain', name: 'Faherty' })
})

test('"sort it again" reruns the saved list; nonsense asks for help', () => {
  assert.deepEqual(parse('run it again', { list: [{ id: 'x' }] }), { intent: 'sort' })
  assert.deepEqual(parse('blue elephants', {}), { intent: 'help', unclear: true })
  assert.deepEqual(parse('hi'), { intent: 'help' })
})

test('adding brands to the list', () => {
  assert.deepEqual(parse('Add Danner and Sanuk to my list'), { intent: 'setup', city: null, loves: [], names: ['Danner', 'Sanuk'], go: true })
  assert.deepEqual(parse('add Faherty').names, ['Faherty'])
})

test('map questions name one brand', () => {
  assert.deepEqual(parse('Where does Filson fit?'), { intent: 'map', name: 'Filson' })
  assert.deepEqual(parse('where would Le Labo sell best'), { intent: 'map', name: 'Le Labo' })
  assert.deepEqual(parse('Best cities for Topo Designs'), { intent: 'map', name: 'Topo Designs' })
  assert.deepEqual(parse('show me a map of Baggu'), { intent: 'map', name: 'Baggu' })
  assert.deepEqual(parse('Where should I sell Stanley?'), { intent: 'map', name: 'Stanley' })
  assert.equal(parse('What if I opened in Austin?').intent, 'whatif')
})

test('questions about data Qloo does not have get an honest topic, seasons are recognised, brands are spotted', () => {
  assert.deepEqual(parse('how much margin does Baggu give?'), { intent: 'nodata', topic: 'pricing', names: ['Baggu'] })
  assert.equal(parse('which brand is trending right now').topic, 'trend')
  assert.equal(parse('what will my sales be next month').topic, 'sales')
  assert.deepEqual(parse('what should I stock for christmas?'), { intent: 'season', season: 'christmas' })
  assert.deepEqual(parse('is Filson good for a beach town?'), { intent: 'help', unclear: true, names: ['Filson'] })
  assert.deepEqual(parse('Is Le Labo too fancy'), { intent: 'help', unclear: true, names: ['Le Labo'] })
  assert.equal(parse('compare Patagonia and North Face').intent, 'compare')
})
