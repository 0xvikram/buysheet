// "Versus a generic bestseller list": the same brands ranked by overall popularity alone,
// with no knowledge of this shop's crowd or city. It shows what Qloo's taste data changed. Pure.
import { third } from './grade.js'

export function popularityBaseline(rows, popularity) {
  const judged = rows.filter((r) => r.group !== 'nosignal' && typeof popularity[r.id] === 'number')
  const order = [...judged].sort((a, b) => popularity[b.id] - popularity[a.id])
  const generic = Object.fromEntries(order.map((r, i) => [r.id, ['stock', 'consider', 'skip'][third(i, order.length)]]))
  const same = judged.filter((r) => generic[r.id] === r.group).length
  const flips = judged
    .filter((r) => [generic[r.id], r.group].sort().join() === 'skip,stock')
    .map((r) => ({ name: r.name, yours: r.group, generic: generic[r.id] }))
  return { compared: judged.length, same, flips, generic }
}
