// A small per-visitor brake so one person cannot spend the shared Qloo quota.
// In memory, so it resets when the server instance does. Good enough for a demo.

const WINDOW_MS = 10 * 60 * 1000
const MAX = 40
const hits = new Map()

export function allow(request) {
  const who = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  const now = Date.now()
  const recent = (hits.get(who) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX) return false
  recent.push(now)
  hits.set(who, recent)
  return true
}

export const tooMany = () =>
  Response.json({ error: 'That is a lot of requests. Please wait a few minutes and try again.' }, { status: 429 })
