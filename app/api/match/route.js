import { allow, tooMany } from '../../../lib/limit.js'
import { parseList } from '../../../lib/match.js'
import { QlooError } from '../../../lib/qloo.js'
import { matchNames } from '../../../lib/sheet.js'

export async function POST(request) {
  if (!allow(request)) return tooMany()
  const { text, kind } = await request.json().catch(() => ({}))
  if (typeof text !== 'string' || !['brand', 'signal'].includes(kind)) {
    return Response.json({ error: 'Send { text, kind } where kind is "brand" or "signal".' }, { status: 400 })
  }
  // The page sends long lists a few names at a time, so each request stays short.
  const names = parseList(text).slice(0, kind === 'signal' ? 5 : 10)
  if (!names.length) return Response.json({ error: 'No names found in that text.' }, { status: 400 })
  const trace = []
  try {
    return Response.json({ matches: await matchNames(names, kind, trace), trace })
  } catch (e) {
    const status = e instanceof QlooError ? 502 : 500
    return Response.json({ error: e instanceof QlooError ? e.message : 'Something went wrong while matching.', trace }, { status })
  }
}
