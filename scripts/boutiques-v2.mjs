// Real-shop test, method v2 (declared in data/method-v2.md before it was run): Qloo's full taste ranking plus a
// quarter-weight city ranking, with all four of the shop's favourites. Same shops, lists and labels as v1.
//   node scripts/boutiques-v2.mjs        (after scripts/boutiques.mjs and scripts/llm-baseline.mjs)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'

const keyFile = `${homedir()}/.config/qloo.key`
if (!process.env.QLOO_API_KEY && existsSync(keyFile)) process.env.QLOO_API_KEY = readFileSync(keyFile, 'utf8').trim()
const { resolveAll, sortBrands } = await import('../lib/tools.js')
const { positions } = await import('../lib/workspace.js')

const file = new URL('../public/examples/boutiques.json', import.meta.url)
const test = JSON.parse(readFileSync(file))
const shops = JSON.parse(readFileSync(new URL('../data/boutiques.json', import.meta.url))).shops
const auc = (pos, neg) => {
  let w = 0
  for (const p of pos) for (const n of neg) w += p > n ? 1 : p === n ? 0.5 : 0
  return w / (pos.length * neg.length)
}
const pct = (p) => (p ? (p.of > 1 ? 1 - (p.at - 1) / (p.of - 1) : 1) : 0.5)

for (const result of test.results) {
  const shop = shops.find((s) => s.name === result.name)
  const loves = (await resolveAll(shop.loves, 'signal', [])).filter((m) => m.state === 'matched').map((m) => ({ id: m.pick.id, name: m.pick.name }))
  const matched = (await resolveAll(result.rows.map((r) => r.name), 'brand', [])).filter((m) => m.state === 'matched')
  const brands = matched.map((m) => ({ id: m.pick.id, name: m.typed, popularity: m.pick.popularity }))
  const { sheet } = await sortBrands({ brands, signals: loves, city: shop.city }, [])
  const carried = new Map(result.rows.map((r) => [r.name, r.carried]))
  const scored = sheet.rows.map((r) => { const p = positions(r); return { name: r.name, carried: carried.get(r.name), score: pct(p.taste) + 0.25 * pct(p.place) } }).filter((r) => r.carried !== undefined)
  result.v2 = {
    loves: loves.map((l) => l.name),
    scored: scored.length,
    auc: Number(auc(scored.filter((r) => r.carried).map((r) => r.score), scored.filter((r) => !r.carried).map((r) => r.score)).toFixed(2)),
  }
  console.log(`${result.name}: v1 ${result.aucRestocked} → v2 ${result.v2.auc} (${result.v2.loves.length} favourites, ${scored.length} brands) · LLM alone ${result.aucLLM} · bestseller ${result.aucBestseller}`)
}
const mean = (f) => Number((test.results.reduce((s, r) => s + f(r), 0) / test.results.length).toFixed(2))
test.mean = { ...test.mean, restockedV2: mean((r) => r.v2.auc) }
console.log('mean', test.mean)
writeFileSync(file, JSON.stringify(test, null, 1))
