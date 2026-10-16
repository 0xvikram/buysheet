// The two server-side jobs: match names to Qloo, and build the sheet.
import { judgeMatch } from './match.js'
import { buildSheet } from './grade.js'
import { rankBrands, search } from './qloo.js'

const KINDS = {
  brand: ['brand'],
  // what a shop's customers love can be a brand, a musician, a show or a film
  signal: ['brand', 'artist', 'tv_show', 'movie'],
}

/** Look up each name in turn and judge every result. */
export async function matchNames(names, kind, trace) {
  const types = KINDS[kind]
  const out = []
  // one at a time: Qloo rejects parallel requests
  for (const name of names) out.push(judgeMatch(name, await search(name, types, trace)))
  return out
}

/** brands and signals are [{ id, name }] the owner has confirmed. */
export async function makeSheet({ brands, signals, city }, trace) {
  const brandIds = brands.map((b) => b.id)
  const signalIds = signals.map((s) => s.id)
  // Two separate questions. See lib/grade.js for why they are not combined.
  const byTaste = signalIds.length
    ? await rankBrands({ brandIds, signalIds }, trace, "Rank the list for your customers' taste")
    : { entities: [] }
  const byPlace = city
    ? await rankBrands({ brandIds, city }, trace, `Rank the list for ${city}`)
    : { entities: [], placeReadAs: null }
  const sheet = buildSheet({
    brands,
    byTaste: byTaste.entities,
    byPlace: byPlace.entities,
    signalNames: Object.fromEntries(signals.map((s) => [s.id, s.name])),
    city,
  })
  return { ...sheet, placeReadAs: byPlace.placeReadAs }
}
