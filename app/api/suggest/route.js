import { QlooError, localCoverage, search, searchPlaces } from '../../../lib/qloo.js'
import { loveOptions, placeOptions } from '../../../lib/suggest.js'

// Suggestions while the owner types their city or what their customers love, and a check that a city has local data.
// Typing makes many small calls, so it has its own, larger allowance per visitor than the agent.
const WINDOW_MS = 10 * 60 * 1000
const MAX = 150
const hits = new Map()
const allow = (request) => {
  const who = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  const now = Date.now()
  const recent = (hits.get(who) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX) return false
  recent.push(now)
  hits.set(who, recent)
  return true
}

export async function GET(request) {
  if (!allow(request)) return Response.json({ error: 'Too many lookups. Please wait a moment.' }, { status: 429 })
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind')
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
  if (q.length < 2) return Response.json({ options: [] })
  try {
    if (kind === 'city') return Response.json({ options: placeOptions(await searchPlaces(q, [])) })
    if (kind === 'love') return Response.json({ options: loveOptions(await search(q, ['brand', 'artist', 'tv_show', 'movie'], [])) })
    if (kind === 'coverage') {
      try {
        const c = await localCoverage(q, [])
        return Response.json({ covered: c.brands.length > 0, readAs: c.readAs, examples: c.brands.slice(0, 3) })
      } catch (e) {
        // Qloo answers 400 when it can't place the location at all: that's "no data there", not a failure
        if (e instanceof QlooError && e.status === 400) return Response.json({ covered: false, readAs: null, examples: [] })
        throw e
      }
    }
    return Response.json({ error: 'Unknown kind' }, { status: 400 })
  } catch (e) {
    return Response.json({ error: e instanceof QlooError ? e.message : 'Lookup failed' }, { status: 502 })
  }
}
