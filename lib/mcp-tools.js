// Runs MCP tool calls on the real tools, and words the answers for an assistant to read.
import { GROUPS } from './grade.js'
import { QlooError } from './qloo.js'
import { compareBrands, describeAudience, findSimilar, resolve, resolveAll, sortBrands } from './tools.js'
import { list } from './words.js'

const strings = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 80)).slice(0, max) : [])

async function one(name, trace) {
  const m = await resolve(String(name).slice(0, 80), 'brand', trace)
  if (!m.pick) throw Object.assign(new Error('unknown'), { publicMessage: `Qloo doesn't know "${name}".` })
  return { id: m.pick.id, name: m.pick.name }
}

export async function runTool(name, args, trace = []) {
  try {
    if (name === 'sort_brand_list') {
      const city = typeof args.city === 'string' ? args.city.trim().slice(0, 80) : ''
      const confirmed = new Set(strings(args.confirmed, 40).map((s) => s.toLowerCase()))
      const loves = (await resolveAll(strings(args.customers_love, 5), 'signal', trace)).filter((m) => m.pick).map((m) => ({ id: m.pick.id, name: m.pick.name }))
      if (!city && !loves.length) throw Object.assign(new Error('needs'), { publicMessage: 'Give the shop\'s city, or what its customers love, or both.' })
      const matches = await resolveAll(strings(args.brands, 40), 'brand', trace)
      const use = matches.filter((m) => m.state === 'matched' || (m.state === 'check' && confirmed.has(m.typed.toLowerCase())))
      const brands = use.map((m) => ({ id: m.pick.id, name: m.typed, popularity: m.pick.popularity }))
      const needs = matches.filter((m) => m.state === 'check' && !confirmed.has(m.typed.toLowerCase())).map((m) => ({ typed: m.typed, qloo_found: m.pick.name, about: m.pick.about }))
      const unknown = matches.filter((m) => m.state === 'unknown').map((m) => m.typed)
      if (brands.length < 3) throw Object.assign(new Error('few'), { publicMessage: `Only ${brands.length} brands matched; a sort needs at least 3.` })
      const { sheet, baseline } = await sortBrands({ brands, signals: loves, city }, trace)
      const group = (g) => sheet.rows.filter((r) => r.group === g).map((r) => r.name)
      const text = [
        ...Object.keys(GROUPS).filter((g) => group(g).length).map((g) => `${GROUPS[g]}: ${group(g).join(', ')}.`),
        needs.length ? `Needs confirmation: ${needs.map((n) => `"${n.typed}" matched ${n.qloo_found}`).join('; ')}.` : '',
        unknown.length ? `Not known to Qloo, left out: ${list(unknown)}.` : '',
        baseline.flips.length ? `A generic bestseller list would make the opposite call on ${list(baseline.flips.map((f) => f.name))}.` : '',
        'These rank what this crowd tends to like; they are not sales forecasts.',
      ].filter(Boolean).join('\n')
      return {
        text,
        data: {
          city, customers_love: loves.map((l) => l.name),
          groups: Object.fromEntries(Object.keys(GROUPS).map((g) => [g, sheet.rows.filter((r) => r.group === g).map((r) => ({ brand: r.name, reasons: r.reasons }))])),
          needs_confirmation: needs, unknown,
          generic_bestseller_disagrees_on: baseline.flips,
        },
      }
    }
    if (name === 'find_similar_brands') {
      const signals = (await resolveAll(strings(args.customers_love, 5), 'signal', trace)).filter((m) => m.pick).map((m) => ({ id: m.pick.id, name: m.pick.name }))
      if (!signals.length) throw Object.assign(new Error('none'), { publicMessage: 'Qloo did not recognise any of those.' })
      const exclude = (await resolveAll(strings(args.exclude, 10), 'brand', trace)).filter((m) => m.pick).map((m) => ({ id: m.pick.id }))
      const s = await findSimilar({ signals, exclude }, trace)
      return { text: s.text, data: { brands: s.brands } }
    }
    if (name === 'describe_audience') {
      const a = await describeAudience(await one(args.brand, trace), trace)
      return { text: a.text, data: { brand: a.brand.name, audience: a.lean } }
    }
    if (name === 'compare_brands') {
      const c = await compareBrands(await one(args.a, trace), await one(args.b, trace), trace)
      const side = (x) => `${x.name}: ${x.lean}${x.stands.length ? ` Its audience stands out for ${list(x.stands)}.` : ''}`
      return { text: [side(c.a), side(c.b)].join('\n'), data: c }
    }
  } catch (e) {
    if (e instanceof QlooError) throw Object.assign(e, { publicMessage: e.message })
    throw e
  }
  throw new Error(`unknown tool ${name}`)
}
