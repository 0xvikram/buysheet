// Does Restocked agree with what real independent shops carry?
// For each shop (data/boutiques.json): the brands it lists on its own site are "carried"; brands from our sample
// supplier list that it doesn't list are "not carried". We give Restocked the shop's city and two of its
// favourites, sort the mixed list, and ask how often a carried brand is ranked above a not-carried one (AUC),
// for Restocked and for a bestseller list (popularity only). The favourites are never scored.
//   node scripts/boutiques.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'

const keyFile = `${homedir()}/.config/qloo.key`
if (!process.env.QLOO_API_KEY && existsSync(keyFile)) process.env.QLOO_API_KEY = readFileSync(keyFile, 'utf8').trim()
const { resolveAll, sortBrands } = await import('../lib/tools.js')

const SAMPLE = ['Baggu', 'Rifle Paper Co.', 'Le Labo', 'Boy Smells', 'Otherland', 'Aesop', 'Moleskine', 'Stanley', 'Hydro Flask', 'Herschel Supply Co', 'Topo Designs', 'Cotopaxi', 'Snow Peak', 'Filson', 'Blundstone', 'Birkenstock', 'Girlfriend Collective', 'Paloma Wool', 'Ganni', 'Rains', 'Bellroy', 'Fjällräven', 'Our Place', 'HAY', 'Glossier']
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\b(co|coolers|boots|inc)\b/g, '').trim()
const SCORE = { stock: 2, consider: 1, skip: 0 }

/** Probability a random carried brand scores above a random not-carried one (ties count half). */
function auc(pos, neg) {
  let wins = 0
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0
  return pos.length && neg.length ? wins / (pos.length * neg.length) : null
}

const data = JSON.parse(readFileSync(new URL('../data/boutiques.json', import.meta.url)))
const results = []
for (const shop of data.shops) {
  const carriedNames = new Set(shop.brands.map(norm))
  const loves = (await resolveAll(shop.loves.slice(0, 2), 'signal', [])).filter((m) => m.state === 'matched').map((m) => ({ id: m.pick.id, name: m.pick.name }))
  const held = new Set(shop.loves.map(norm))
  const carried = (await resolveAll(shop.brands.filter((b) => !held.has(norm(b))).slice(0, 22), 'brand', [])).filter((m) => m.state === 'matched')
  const notCarried = (await resolveAll(SAMPLE.filter((b) => !carriedNames.has(norm(b))), 'brand', [])).filter((m) => m.state === 'matched')
  const brands = [...carried, ...notCarried].map((m) => ({ id: m.pick.id, name: m.typed, popularity: m.pick.popularity }))
  const seen = new Set()
  const unique = brands.filter((b) => !seen.has(b.id) && seen.add(b.id) && !loves.some((l) => l.id === b.id))
  const { sheet, baseline } = await sortBrands({ brands: unique, signals: loves, city: shop.city }, [])
  const isCarried = new Set(carried.map((m) => m.pick.id))
  const rows = sheet.rows.filter((r) => r.group !== 'nosignal')
  const ours = (r) => SCORE[r.group]
  const generic = (r) => SCORE[baseline.generic[r.id]] ?? 1
  const pos = rows.filter((r) => isCarried.has(r.id))
  const neg = rows.filter((r) => !isCarried.has(r.id))
  const share = (list, g) => (list.length ? Math.round((list.filter((r) => r.group === g).length / list.length) * 100) : 0)
  const r = {
    name: shop.name, city: shop.city, url: shop.url, loves: loves.map((l) => l.name),
    carried: pos.length, notCarried: neg.length,
    aucRestocked: Number(auc(pos.map(ours), neg.map(ours)).toFixed(2)),
    aucBestseller: Number(auc(pos.map(generic), neg.map(generic)).toFixed(2)),
    carriedStock: share(pos, 'stock'), carriedSkip: share(pos, 'skip'),
    notCarriedStock: share(neg, 'stock'), notCarriedSkip: share(neg, 'skip'),
    rows: rows.map((x) => ({ name: x.name, group: x.group, generic: baseline.generic[x.id] ?? null, carried: isCarried.has(x.id) })),
  }
  results.push(r)
  console.log(`${r.name}: ${r.carried} carried vs ${r.notCarried} not · AUC Restocked ${r.aucRestocked} vs bestseller ${r.aucBestseller} · carried in stock ${r.carriedStock}% / skip ${r.carriedSkip}% · not carried in stock ${r.notCarriedStock}% / skip ${r.notCarriedSkip}%`)
}
writeFileSync(new URL('../public/examples/boutiques.json', import.meta.url), JSON.stringify({ recordedOn: new Date().toISOString().slice(0, 10), checked: data.checked, results }, null, 1))
