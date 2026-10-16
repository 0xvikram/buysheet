import { allow, tooMany } from '../../../lib/limit.js'
import { QlooError } from '../../../lib/qloo.js'
import { makeSheet } from '../../../lib/sheet.js'

const isEntity = (e) => e && typeof e.id === 'string' && /^[0-9A-Fa-f-]{36}$/.test(e.id) && typeof e.name === 'string'

export async function POST(request) {
  if (!allow(request)) return tooMany()
  const body = await request.json().catch(() => ({}))
  const brands = Array.isArray(body.brands) ? body.brands.filter(isEntity).slice(0, 50) : []
  const signals = Array.isArray(body.signals) ? body.signals.filter(isEntity).slice(0, 5) : []
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 80) : ''
  if (brands.length < 3) return Response.json({ error: 'A sheet needs at least 3 matched brands.' }, { status: 400 })
  if (!city && !signals.length) {
    return Response.json({ error: 'Say where the shop is, or what its customers love, or both.' }, { status: 400 })
  }
  const trace = []
  try {
    const clean = (e) => ({ id: e.id, name: e.name.slice(0, 80) })
    const sheet = await makeSheet({ brands: brands.map(clean), signals: signals.map(clean), city }, trace)
    return Response.json({ sheet, trace })
  } catch (e) {
    const status = e instanceof QlooError ? 502 : 500
    return Response.json({ error: e instanceof QlooError ? e.message : 'Something went wrong while building the sheet.', trace }, { status })
  }
}
