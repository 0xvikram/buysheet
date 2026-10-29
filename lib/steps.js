// The agent's run, told as plain steps for the owner: what it read, what it asked Qloo, how it decided.
// Built only from the drop and the trace of Qloo calls it made. Pure.
import { list } from './words.js'

const count = (trace, test) => trace.filter((t) => test(t.label || '')).length

export function agentSteps(record) {
  const { drop } = record
  const trace = record.trace || []
  const rows = drop.sheet.rows
  const c = Object.fromEntries(['stock', 'consider', 'skip', 'nosignal'].map((g) => [g, rows.filter((r) => r.group === g).length]))
  const lookups = count(trace, (l) => l.startsWith('Look up'))
  const taste = trace.find((t) => /customers' taste/.test(t.label || ''))
  const place = trace.find((t) => (t.label || '').startsWith('Rank the list for') && !/taste/.test(t.label))
  const flips = drop.baseline?.flips ?? []
  const steps = []

  steps.push({
    kind: 'read',
    title: 'Read the shop',
    detail: [drop.city && `Shop in ${drop.city}`, drop.loves?.length && `customers love ${list(drop.loves)}`, `${rows.length} brands on the supplier list`].filter(Boolean).join(' · '),
  })
  if (lookups) {
    steps.push({
      kind: 'qloo',
      title: `Checked ${lookups} names on Qloo`,
      detail: 'Each brand and favourite looked up one at a time. Exact matches kept, doubtful ones asked about, unknown ones left out. Nothing guessed.',
    })
  }
  if (taste) {
    steps.push({
      kind: 'qloo',
      title: 'Ranked the list for this crowd’s taste',
      detail: `Asked Qloo which of these brands fans of ${list(drop.loves || [])} also love, with the reason behind each match. ${taste.results ?? 0} brands came back.`,
    })
  }
  if (place) {
    steps.push({
      kind: 'qloo',
      title: `Ranked the list for ${drop.city}`,
      detail: `Asked separately, because Qloo only returns brands it has local data for. ${place.results ?? 0} brands have a local reading.`,
    })
  }
  steps.push({
    kind: 'decide',
    title: 'Decided each call',
    detail: `Taste first (top, middle or bottom third), then the city lifts or lowers one step. Missing data never counts against a brand. Result: ${c.stock} stock, ${c.consider} consider, ${c.skip} skip${c.nosignal ? `, ${c.nosignal} with no signal` : ''}.`,
  })
  steps.push({
    kind: 'check',
    title: 'Checked against a bestseller list',
    detail: flips.length
      ? `A popularity-only list would make the opposite call on ${list(flips.map((f) => f.name))}. That's where this crowd differs.`
      : 'A popularity-only list agrees on this one: this crowd is close to the average shopper.',
  })
  return steps
}
