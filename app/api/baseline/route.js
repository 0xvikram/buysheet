import { plainGuess } from '../../../lib/gemini.js'
import { allow, tooMany } from '../../../lib/limit.js'

const names = (v, max) => (Array.isArray(v) ? v.filter((n) => typeof n === 'string').map((n) => n.slice(0, 80)).slice(0, max) : [])

export async function POST(request) {
  if (!allow(request)) return tooMany()
  const body = await request.json().catch(() => ({}))
  const brands = names(body.brands, 50)
  if (brands.length < 3) return Response.json({ error: 'Send at least 3 brand names.' }, { status: 400 })
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 80) : ''
  return Response.json(await plainGuess({ brands, signals: names(body.signals, 5), city }))
}
