// Scores the "LLM alone" answers (data/llm-baseline.json) on the same real-shop test as Restocked
// (public/examples/boutiques.json): how often a brand the shop carries is ranked above one it doesn't.
//   node scripts/llm-baseline.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const file = new URL('../public/examples/boutiques.json', import.meta.url)
const test = JSON.parse(readFileSync(file))
const llm = JSON.parse(readFileSync(new URL('../data/llm-baseline.json', import.meta.url)))
const key = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\bplus\b/g, '+').replace(/[^a-z0-9+]+/g, '')
const SCORE = { stock: 2, consider: 1, skip: 0 }
const auc = (pos, neg) => {
  let w = 0
  for (const p of pos) for (const n of neg) w += p > n ? 1 : p === n ? 0.5 : 0
  return pos.length && neg.length ? w / (pos.length * neg.length) : null
}

for (const shop of test.results) {
  const answer = llm.shops[shop.name]
  const call = {}
  for (const g of ['stock', 'consider', 'skip']) for (const n of answer[g]) call[key(n)] = g
  const missing = shop.rows.filter((r) => !call[key(r.name)]).map((r) => r.name)
  if (missing.length) throw new Error(`${shop.name}: no LLM call for ${missing.join(', ')}`)
  const score = (r) => SCORE[call[key(r.name)]]
  shop.aucLLM = Number(auc(shop.rows.filter((r) => r.carried).map(score), shop.rows.filter((r) => !r.carried).map(score)).toFixed(2))
  console.log(`${shop.name}: Restocked ${shop.aucRestocked} · LLM alone ${shop.aucLLM} · bestseller ${shop.aucBestseller}`)
}
const mean = (k) => Number((test.results.reduce((s, r) => s + r[k], 0) / test.results.length).toFixed(2))
test.llm = { model: llm.model, asked: llm.asked }
test.mean = { restocked: mean('aucRestocked'), llm: mean('aucLLM'), bestseller: mean('aucBestseller') }
console.log('mean', test.mean)
writeFileSync(file, JSON.stringify(test, null, 1))
