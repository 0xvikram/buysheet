// Server-side Qloo client. The key never leaves the server and is never logged.
// Every call is recorded in a trace the page can show ("Show the work").

const BASE = 'https://hackathon.api.qloo.com'

// Qloo silently ignores parameters it does not know, which hides mistakes.
// Only these are ever sent.
const ALLOWED = new Set([
  'query', 'types', 'take',
  'filter.type', 'filter.results.entities',
  'signal.interests.entities', 'signal.location.query',
  'feature.explainability', 'filter.popularity.max', 'filter.exclude.entities',
  'a.signal.interests.entities', 'b.signal.interests.entities',
])

const cache = new Map() // url -> { at, body }
const CACHE_MS = 6 * 60 * 60 * 1000

// Qloo answers 429 to parallel requests, so every live call waits its turn and
// leaves a gap after the one before. A 429 is retried a bounded number of times.
const GAP_MS = 350
const RETRY_WAITS_MS = [1500, 4000]
let queue = Promise.resolve()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function inTurn(task) {
  const run = queue.then(task)
  queue = run.catch(() => {}).then(() => sleep(GAP_MS))
  return run
}

async function fetchPaced(url, key) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { 'X-Api-Key': key, Accept: 'application/json' }, cache: 'no-store' })
    if (response.status !== 429 || attempt >= RETRY_WAITS_MS.length) return { response, retries: attempt }
    const asked = Number(response.headers.get('retry-after')) * 1000
    await sleep(asked > 0 && asked <= 10000 ? asked : RETRY_WAITS_MS[attempt])
  }
}

export class QlooError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function call(path, params, trace, label) {
  const key = process.env.QLOO_API_KEY
  if (!key) throw new QlooError(500, 'The Qloo key is not set on the server.')
  for (const name of Object.keys(params)) {
    if (!ALLOWED.has(name)) throw new QlooError(500, `Parameter not on the allow-list: ${name}`)
  }
  const query = new URLSearchParams(params).toString()
  const url = `${BASE}${path}?${query}`
  const started = Date.now()
  const entry = { label, path, params, status: null, results: null, ms: 0, cached: false }
  trace?.push(entry)

  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < CACHE_MS) {
    Object.assign(entry, { status: 200, cached: true })
    return { body: hit.body, entry }
  }
  const { response, retries } = await inTurn(() => fetchPaced(url, key))
  entry.status = response.status
  entry.ms = Date.now() - started
  if (retries) entry.retries = retries
  if (!response.ok) {
    throw new QlooError(response.status, response.status === 429 ? 'Qloo is rate-limiting us. Try again in a minute.' : `Qloo answered ${response.status}.`)
  }
  const body = await response.json()
  cache.set(url, { at: Date.now(), body })
  return { body, entry }
}

/** Look a name up. `types` is a list like ['brand'] or ['brand', 'artist']. */
export async function search(name, types, trace) {
  const { body, entry } = await call(
    '/search',
    { query: name, types: types.map((t) => `urn:entity:${t}`).join(','), take: '5' },
    trace,
    `Look up "${name}"`,
  )
  entry.results = body.results?.length ?? 0
  return body.results ?? []
}

/** Rank a fixed list of brands for a taste, a place, or both. Best first. */
export async function rankBrands({ brandIds, signalIds = [], city }, trace, label) {
  const params = {
    'filter.type': 'urn:entity:brand',
    'filter.results.entities': brandIds.join(','),
    take: '50',
  }
  if (signalIds.length) {
    params['signal.interests.entities'] = signalIds.join(',')
    params['feature.explainability'] = 'true'
  }
  if (city) params['signal.location.query'] = city
  const { body, entry } = await call('/v2/insights', params, trace, label)
  const entities = body.results?.entities ?? []
  entry.results = entities.length
  return {
    entities,
    placeReadAs: body.query?.localities?.signal?.name ?? null,
  }
}

/** Brands fans of these things also love. Very famous brands can be left out with maxPopularity. */
export async function similarBrands({ signalIds, excludeIds = [], maxPopularity, take = 12 }, trace) {
  const params = { 'filter.type': 'urn:entity:brand', 'signal.interests.entities': signalIds.join(','), take: String(take) }
  if (excludeIds.length) params['filter.exclude.entities'] = excludeIds.join(',')
  if (maxPopularity) params['filter.popularity.max'] = String(maxPopularity)
  const { body, entry } = await call('/v2/insights', params, trace, 'Find brands this crowd also loves')
  const entities = body.results?.entities ?? []
  entry.results = entities.length
  return entities
}

/** Age and gender lean for each entity: positive means over-represented, negative under. */
export async function demographics(ids, trace) {
  const { body, entry } = await call(
    '/v2/insights',
    { 'filter.type': 'urn:demographics', 'signal.interests.entities': ids.join(',') },
    trace,
    'Read who the audience is',
  )
  const rows = body.results?.demographics ?? []
  entry.results = rows.length
  return rows
}

/** Descriptive tags that set audience A apart from audience B, and the reverse. */
export async function compareAudiences(aId, bId, trace) {
  const { body, entry } = await call(
    '/v2/insights/compare',
    { 'a.signal.interests.entities': aId, 'b.signal.interests.entities': bId, take: '12' },
    trace,
    'Compare the two audiences',
  )
  const r = body.results ?? {}
  entry.results = (r.a?.length ?? 0) + (r.b?.length ?? 0)
  return { shared: r.tags ?? [], onlyA: r.a ?? [], onlyB: r.b ?? [] }
}
