// The agent's tools. Each one asks Qloo a narrow question and returns plain facts plus a sentence.
// Shared by the in-app agent (lib/agent.js) and the MCP server (app/api/mcp/route.js).
import { popularityBaseline } from './baseline.js'
import { CITIES, cityText, readCities } from './cities.js'
import { judgeMatch } from './match.js'
import { compareAudiences, demographics, rankBrands, search, similarBrands } from './qloo.js'
import { makeSheet } from './sheet.js'
import { describeLean, list } from './words.js'

const KINDS = { brand: ['brand'], signal: ['brand', 'artist', 'tv_show', 'movie'] }

/** One name -> { typed, state: matched|check|unknown, pick, options }. */
export async function resolve(name, kind, trace) {
  return judgeMatch(name, await search(name, KINDS[kind], trace))
}

export async function resolveAll(names, kind, trace) {
  const out = []
  for (const name of names) out.push(await resolve(name, kind, trace)) // one at a time: Qloo rejects parallel calls
  return out
}

/** Sort confirmed brands for a shop. brands: [{ id, name, popularity }]; signals: [{ id, name }]. */
export async function sortBrands({ brands, signals, city }, trace) {
  const asked = brands.filter((b) => !signals.some((s) => s.id === b.id)) // a favourite is the question, not an answer
  const sheet = await makeSheet({ brands: asked, signals, city }, trace)
  const popularity = Object.fromEntries(asked.map((b) => [b.id, b.popularity]))
  return { sheet, baseline: popularityBaseline(sheet.rows, popularity) }
}

/** Brands fans of the signals also love, leaving out the very famous and anything already listed. */
export async function findSimilar({ signals, exclude = [] }, trace) {
  const found = await similarBrands(
    { signalIds: signals.map((s) => s.id), excludeIds: exclude.map((e) => e.id), maxPopularity: 0.95, take: 12 },
    trace,
  )
  const skip = new Set([...signals, ...exclude].map((e) => e.id))
  const brands = found
    .filter((e) => !skip.has(e.entity_id))
    .slice(0, 8)
    .map((e) => ({ id: e.entity_id, name: e.name, about: (e.properties?.short_description || '').slice(0, 120) }))
  return {
    brands,
    text: brands.length
      ? `Fans of ${list(signals.map((s) => s.name))} also love ${list(brands.map((b) => b.name))}. I left out the most famous names, which you likely know already.`
      : `Qloo had no further brands for fans of ${list(signals.map((s) => s.name))}.`,
  }
}

/** Who buys this brand, in one sentence. */
export async function describeAudience(brand, trace) {
  const rows = await demographics([brand.id], trace)
  const lean = describeLean(rows.find((r) => r.entity_id === brand.id)?.query ?? rows[0]?.query)
  return { brand, lean, text: `${brand.name}: ${lean.charAt(0).toLowerCase()}${lean.slice(1)}` }
}

/** Two brands side by side: who buys each, and what sets each audience apart. */
export async function compareBrands(a, b, trace) {
  const rows = await demographics([a.id, b.id], trace)
  const lean = (e) => describeLean(rows.find((r) => r.entity_id === e.id)?.query)
  const tags = await compareAudiences(a.id, b.id, trace)
  const names = (t) => t.slice(0, 6).map((x) => x.name)
  return {
    a: { ...a, lean: lean(a), stands: names(tags.onlyA) },
    b: { ...b, lean: lean(b), stands: names(tags.onlyB) },
    shared: names(tags.shared),
  }
}

/** Where one brand fits across US cities: one local reading per city, asked one at a time. */
export async function mapBrand(brand, trace) {
  const readings = []
  for (const c of CITIES) {
    const { entities } = await rankBrands({ brandIds: [brand.id], city: c.query }, trace, `Read ${brand.name} in ${c.name}`)
    const affinity = entities.find((e) => e.entity_id === brand.id)?.query?.affinity
    readings.push({ name: c.name, lat: c.lat, lon: c.lon, affinity: typeof affinity === 'number' ? affinity : null })
  }
  const rows = readCities(readings)
  return { brand, rows, text: cityText(brand.name, rows) }
}
