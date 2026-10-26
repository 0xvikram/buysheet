// The in-app agent. It plans with fixed rules (no language model): it reads the message,
// works out what it still needs, asks for it, runs the right Qloo tools in order, and keeps
// track of the shop between messages. All of its state travels with the conversation.
import { GROUPS } from './grade.js'
import { parse } from './intent.js'
import { compareBrands, describeAudience, findSimilar, resolve, resolveAll, sortBrands } from './tools.js'
import { list } from './words.js'

export const MAX_BRANDS = 40

const EMPTY = { city: '', loves: [], list: [], pending: [], skipped: [], drops: 0, drop: null }

/** A private copy of the conversation state: never share arrays between conversations. */
export function freshState(state) {
  const s = { ...EMPTY, ...(state && typeof state === 'object' ? state : {}) }
  for (const k of ['loves', 'list', 'pending', 'skipped']) s[k] = Array.isArray(s[k]) ? [...s[k]] : []
  return s
}

const ELSEWHERE = ['Austin', 'Portland', 'Brooklyn', 'Denver', 'Nashville', 'London']

const CHIPS = {
  start: ['I run a gift shop in Denver. My customers love Patagonia and Tyler Childers.'],
  afterDrop: (drop) => {
    const other = ELSEWHERE.find((c) => !(drop.city || '').toLowerCase().includes(c.toLowerCase()))
    const skipped = drop.sheet.rows.find((r) => r.group === 'skip')
    const stocked = drop.sheet.rows.filter((r) => r.group === 'stock')
    return [
      skipped && `Why skip ${skipped.name}?`,
      `What if I opened in ${other}?`,
      stocked[0] && `Who buys ${stocked[0].name}?`,
      stocked[1] && stocked[0] && `${stocked[0].name} vs ${stocked[1].name}`,
      'Find me new brands for my crowd',
    ].filter(Boolean)
  },
}

const say = (text) => ({ type: 'text', text })

function needs(state) {
  const missing = []
  if (!state.list.length) missing.push("the supplier's brand list (paste it, one per line)")
  if (!state.city && !state.loves.length) missing.push('where your shop is, or what your customers already love (ideally both)')
  return missing
}

function askPending(state) {
  const p = state.pending[0]
  return {
    replies: [say(`Quick check: by "${p.typed}" do you mean ${p.pick.name}?${p.pick.about ? ` (${p.pick.about})` : ''}`)],
    chips: [`Yes, ${p.pick.name}`, 'No, leave it out'],
  }
}

function dropTitle(state, city) {
  const where = city || state.city
  const who = state.loves.length ? `for fans of ${list(state.loves.map((l) => l.name))}` : ''
  return [where && `${where}`, who].filter(Boolean).join(', ') || 'Your shop'
}

async function makeDrop(state, trace, { city = state.city, whatIf = false } = {}) {
  const { sheet, baseline } = await sortBrands({ brands: state.list, signals: state.loves, city }, trace)
  const drop = {
    number: state.drops + 1,
    title: dropTitle(state, city),
    city,
    loves: state.loves.map((l) => l.name),
    whatIf,
    sheet,
    baseline,
    at: new Date().toISOString(),
  }
  return drop
}

function dropSummary(drop) {
  const c = drop.sheet.counts
  const stock = drop.sheet.rows.filter((r) => r.group === 'stock').slice(0, 4).map((r) => r.name)
  const parts = [
    `Drop #${String(drop.number).padStart(2, '0')} is ready: ${c.stock} to stock, ${c.consider} to consider, ${c.skip} to skip${c.nosignal ? `, ${c.nosignal} with no signal` : ''}.`,
    stock.length ? `Top picks: ${list(stock)}.` : '',
  ]
  const b = drop.baseline
  if (b.compared) {
    parts.push(
      b.flips.length
        ? `A generic bestseller list would have made the opposite call on ${list(b.flips.map((f) => f.name))}. That is where your crowd differs from the average shopper.`
        : `A generic bestseller list agrees on ${b.same} of ${b.compared}, so your crowd is close to the average shopper on this list.`,
    )
  }
  return parts.filter(Boolean).join(' ')
}

/** What changed between two drops for the same list. */
function diff(before, after) {
  const was = Object.fromEntries(before.sheet.rows.map((r) => [r.id, r.group]))
  const up = []
  const down = []
  const rank = { stock: 0, consider: 1, skip: 2, nosignal: 3 }
  for (const r of after.sheet.rows) {
    if (!(r.id in was) || r.group === 'nosignal' || was[r.id] === 'nosignal') continue
    if (rank[r.group] < rank[was[r.id]]) up.push(r.name)
    if (rank[r.group] > rank[was[r.id]]) down.push(r.name)
  }
  return { up, down }
}

async function runSort(state, trace, replies) {
  const missing = needs(state)
  if (missing.length) {
    replies.push(say(`To sort this I still need ${list(missing)}.`))
    return { chips: state.list.length ? ['My shop is in Denver', 'My customers love Patagonia and Carhartt'] : CHIPS.start }
  }
  const drop = await makeDrop(state, trace)
  state.drops = drop.number
  state.drop = drop
  replies.push(say(dropSummary(drop)), { type: 'drop', drop })
  return { chips: CHIPS.afterDrop(drop) }
}

/** Match brand names into the saved list. Doubtful ones go to `pending` for a yes/no. */
async function addBrands(state, names, trace, replies) {
  const known = new Set(state.list.map((b) => b.name.toLowerCase()))
  const fresh = names.filter((n) => !known.has(n.toLowerCase())).slice(0, Math.max(0, MAX_BRANDS - state.list.length))
  if (names.length > fresh.length && state.list.length + fresh.length >= MAX_BRANDS) {
    replies.push(say(`I can sort up to ${MAX_BRANDS} brands at a time, so I took the first ${MAX_BRANDS}.`))
  }
  const matches = await resolveAll(fresh, 'brand', trace)
  for (const m of matches) {
    if (m.state === 'matched') state.list.push({ id: m.pick.id, name: m.typed, popularity: m.pick.popularity })
    else if (m.state === 'check') state.pending.push({ typed: m.typed, pick: m.pick })
    else state.skipped.push(m.typed)
  }
  const unknown = matches.filter((m) => m.state === 'unknown').map((m) => m.typed)
  const ok = matches.filter((m) => m.state === 'matched').length
  replies.push(
    say(
      `Matched ${ok} of ${matches.length} brands.` +
        (unknown.length ? ` Qloo doesn't know ${list(unknown)}, so I'll leave ${unknown.length === 1 ? 'it' : 'them'} out rather than guess.` : ''),
    ),
  )
}

async function setLoves(state, names, trace, replies) {
  const matches = await resolveAll(names.slice(0, 5), 'signal', trace)
  const found = matches.filter((m) => m.pick)
  state.loves = found.map((m) => ({ id: m.pick.id, name: m.pick.name }))
  const unsure = found.filter((m) => m.state === 'check').map((m) => `"${m.typed}" as ${m.pick.name}`)
  const missing = matches.filter((m) => !m.pick).map((m) => m.typed)
  replies.push(
    say(
      [
        found.length ? `Got it: your customers love ${list(state.loves.map((l) => l.name))}.` : '',
        unsure.length ? `I read ${list(unsure)}; say so if that's wrong.` : '',
        missing.length ? `I couldn't find ${list(missing)}.` : '',
      ].filter(Boolean).join(' '),
    ),
  )
}

/** Find a brand for compare/audience questions: the saved list first, then Qloo. */
async function brandNamed(name, state, trace) {
  const inList = state.list.find((b) => b.name.toLowerCase() === name.toLowerCase())
  if (inList) return { brand: inList }
  const m = await resolve(name, 'brand', trace)
  if (!m.pick) return { missing: name }
  return { brand: { id: m.pick.id, name: m.pick.name }, readAs: m.state === 'check' ? `I read "${name}" as ${m.pick.name}.` : '' }
}

const HELP = [
  "I'm your buying agent. Tell me where your shop is and what your customers already love, then paste a supplier's brand list. I'll sort it into stock, consider and skip, with the evidence.",
  'After that you can ask me why a brand landed where it did, what changes in another city, who buys a brand, how two brands compare, or for new brands your crowd would like.',
]

/**
 * One turn of the conversation.
 * @returns {{ replies: object[], chips: string[], state: object }}
 */
export async function respond(message, incoming, trace = []) {
  const state = freshState(incoming)
  const p = parse(message, state)
  const replies = []
  let chips = []

  if (p.intent === 'help') {
    replies.push(say(p.unclear ? "I didn't catch that. Here's what I can do:" : HELP[0]))
    if (p.unclear) replies.push(say(HELP.join(' ')))
    else replies.push(say(HELP[1]))
    return { replies, chips: state.drop ? CHIPS.afterDrop(state.drop) : CHIPS.start, state }
  }

  if (p.intent === 'answer') {
    const asked = state.pending.shift()
    if (p.yes) {
      state.list.push({ id: asked.pick.id, name: asked.typed, popularity: asked.pick.popularity })
      replies.push(say(`Added ${asked.typed}.`))
    } else {
      state.skipped.push(asked.typed)
      replies.push(say(`Left ${asked.typed} out.`))
    }
    if (state.pending.length) {
      const next = askPending(state)
      return { replies: [...replies, ...next.replies], chips: next.chips, state }
    }
    ;({ chips } = await runSort(state, trace, replies))
    return { replies, chips, state }
  }

  if (p.intent === 'setup') {
    if (p.city) {
      state.city = p.city
      replies.push(say(`Noted: your shop is in ${p.city}.`))
    }
    if (p.loves.length) await setLoves(state, p.loves, trace, replies)
    if (p.names.length) await addBrands(state, p.names, trace, replies)
    if (state.pending.length) {
      const next = askPending(state)
      return { replies: [...replies, ...next.replies], chips: next.chips, state }
    }
    if (state.list.length && (p.names.length || p.go || !state.drop)) {
      ;({ chips } = await runSort(state, trace, replies))
      return { replies, chips, state }
    }
    const missing = needs(state)
    if (missing.length) replies.push(say(`Next I need ${list(missing)}.`))
    else if (state.drop) {
      replies.push(say('Want me to sort the list again with that?'))
      chips = ['Sort it again']
    }
    return { replies, chips: chips.length ? chips : missing.length && !state.list.length ? ['Paste a brand list'] : chips, state }
  }

  if (p.intent === 'sort') {
    ;({ chips } = await runSort(state, trace, replies))
    return { replies, chips, state }
  }

  if (p.intent === 'whatif') {
    if (!state.list.length) {
      replies.push(say(`Paste a brand list first and I'll show how it plays in ${p.city}.`))
      return { replies, chips: [], state }
    }
    const before = state.drop
    const drop = await makeDrop(state, trace, { city: p.city, whatIf: true })
    state.drops = drop.number
    const d = before ? diff(before, drop) : { up: [], down: [] }
    replies.push(
      say(
        `In ${p.city}: ${dropSummary(drop)}` +
          (before
            ? ` Compared with ${before.city || 'your current drop'}, ${d.up.length ? `${list(d.up)} move up` : 'nothing moves up'}${d.down.length ? ` and ${list(d.down)} move down` : ''}.`
            : ''),
      ),
      { type: 'drop', drop },
    )
    replies.push(say(`This is a what-if. Your shop is still set to ${state.city || 'no city'}.`))
    return { replies, chips: CHIPS.afterDrop(drop), state }
  }

  if (p.intent === 'explain') {
    const row = p.brand || state.drop?.sheet.rows.find((r) => r.name.toLowerCase() === (p.name || '').toLowerCase())
    if (!row) {
      replies.push(say(p.name ? `${p.name} isn't on your latest drop. Add it to a list and I'll sort it.` : 'Which brand? Ask "why skip Baggu?" after a drop.'))
      return { replies, chips: state.drop ? CHIPS.afterDrop(state.drop) : [], state }
    }
    const generic = state.drop?.baseline?.generic?.[row.id]
    replies.push(
      say(`${row.name} is in ${GROUPS[row.group].toLowerCase()}. ${row.reasons.join(' ')}`),
      ...(generic && generic !== row.group ? [say(`A generic bestseller list would have put it in ${GROUPS[generic].toLowerCase()}.`)] : []),
    )
    return { replies, chips: CHIPS.afterDrop(state.drop), state }
  }

  if (p.intent === 'audience') {
    const r = await brandNamed(p.name, state, trace)
    if (!r.brand) {
      replies.push(say(`Qloo doesn't know ${r.missing}.`))
      return { replies, chips: [], state }
    }
    const a = await describeAudience(r.brand, trace)
    replies.push(...(r.readAs ? [say(r.readAs)] : []), say(a.text), { type: 'audience', audience: a })
    return { replies, chips: state.drop ? CHIPS.afterDrop(state.drop) : [], state }
  }

  if (p.intent === 'compare') {
    const [ra, rb] = [await brandNamed(p.a, state, trace), await brandNamed(p.b, state, trace)]
    const missing = [ra, rb].filter((r) => !r.brand).map((r) => r.missing)
    if (missing.length) {
      replies.push(say(`Qloo doesn't know ${list(missing)}.`))
      return { replies, chips: [], state }
    }
    const c = await compareBrands(ra.brand, rb.brand, trace)
    const inDrop = (b) => state.drop?.sheet.rows.find((r) => r.id === b.id)
    const verdict = [inDrop(ra.brand), inDrop(rb.brand)].every(Boolean)
      ? ` On your latest drop, ${ra.brand.name} is ${GROUPS[inDrop(ra.brand).group].toLowerCase()} and ${rb.brand.name} is ${GROUPS[inDrop(rb.brand).group].toLowerCase()}.`
      : ''
    replies.push(
      ...[ra.readAs, rb.readAs].filter(Boolean).map(say),
      say(`Here's how ${ra.brand.name} and ${rb.brand.name} differ.${verdict}`),
      { type: 'compare', compare: c },
    )
    return { replies, chips: state.drop ? CHIPS.afterDrop(state.drop) : [], state }
  }

  if (p.intent === 'similar') {
    let signals = state.loves
    if (p.names.length) {
      const matches = await resolveAll(p.names, 'signal', trace)
      signals = matches.filter((m) => m.pick).map((m) => ({ id: m.pick.id, name: m.pick.name }))
    }
    if (!signals.length) {
      replies.push(say('Tell me what your customers love, or ask "brands like Filson".'))
      return { replies, chips: [], state }
    }
    const s = await findSimilar({ signals, exclude: state.list }, trace)
    replies.push(say(s.text), { type: 'similar', similar: s })
    if (s.brands.length) chips = [`Add ${s.brands[0].name} and ${s.brands[1]?.name ?? s.brands[0].name} to my list`]
    return { replies, chips, state }
  }

  return { replies: [say(HELP[0])], chips: CHIPS.start, state }
}
