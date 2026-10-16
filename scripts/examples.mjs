// Make the two saved examples the page offers, by running the real flow once.
// Keys come from the environment; locally the Qloo key may live in ~/.config/qloo.key.
//   node scripts/examples.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { plainGuess } from '../lib/gemini.js'
import { makeSheet, matchNames } from '../lib/sheet.js'
import { parseList } from '../lib/match.js'

const keyFile = `${homedir()}/.config/qloo.key`
if (!process.env.QLOO_API_KEY && existsSync(keyFile)) process.env.QLOO_API_KEY = readFileSync(keyFile, 'utf8').trim()

const LIST = `Baggu
Rifle Paper Co.
Le Labo
Boy Smells
Otherland
Aesop
Moleskine
Stanley
Hydro Flask
Herschel Supply Co
Topo Designs
Cotopaxi
Snow Peak
Filson
Blundstone
Birkenstock
Girlfriend Collective
Paloma Wool
Ganni
Rains
Bellroy
Fjällräven
Kapital
Fellow
Graza
Fishwife
Earl of East
Our Place
HAY
Glossier`

// How a shop owner would answer the "is this it?" questions for this list.
const ANSWERS = { 'Le Labo': true, Kapital: false, Fellow: false }

const SHOPS = {
  denver: { city: 'Denver, Colorado', loves: 'Patagonia, Carhartt, Tyler Childers' },
  brooklyn: { city: 'Brooklyn, New York', loves: 'Glossier, Aesop, Phoebe Bridgers' },
}

for (const [name, { city, loves }] of Object.entries(SHOPS)) {
  const trace = []
  const matches = await matchNames(parseList(LIST), 'brand', trace)
  const brands = matches
    .filter((m) => m.state === 'matched' || (m.state === 'check' && ANSWERS[m.typed] === true))
    .map((m) => ({ id: m.pick.id, name: m.typed }))
  const signalMatches = await matchNames(parseList(loves), 'signal', trace)
  const signals = signalMatches.filter((m) => m.pick).map((m) => ({ id: m.pick.id, name: m.pick.name }))
  // a brand the customers already love is the question, not an answer
  const asked = brands.filter((b) => !signals.some((s) => s.id === b.id))
  const sheet = await makeSheet({ brands: asked, signals, city }, trace)
  const plain = await plainGuess({ brands: asked.map((b) => b.name), signals: signals.map((s) => s.name), city })
  writeFileSync(
    new URL(`../public/examples/${name}.json`, import.meta.url),
    JSON.stringify({ madeOn: new Date().toISOString().slice(0, 10), list: LIST, matches, answers: ANSWERS, loves, shop: { city, signals }, sheet, plain, trace }),
  )
  console.log(name, sheet.counts, '| plain AI:', plain.available ? 'ok' : plain.why, '| Qloo calls:', trace.length)
  for (const g of ['stock', 'skip']) console.log('  ', g, sheet.rows.filter((r) => r.group === g).map((r) => r.name).join(', '))
}
