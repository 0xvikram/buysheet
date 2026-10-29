// The shop's workspace: its profile, its drops and the agent conversation. Pure functions only;
// the browser keeps the workspace (components/app/Workspace.js) until accounts exist.

export const EMPTY_WORKSPACE = { v: 2, shop: null, drops: [], agent: { messages: [], state: {}, chips: [] }, maps: [], basket: [], sample: null }

export const SHOP_KINDS = ['Gift shop', 'Apparel boutique', 'Beauty & apothecary', 'Outdoor & sport', 'Home & living', 'Bookshop', 'General store', 'Other']

const GROUPS = ['stock', 'consider', 'skip', 'nosignal']

/** A workspace read from storage, with anything missing or broken replaced. */
export function cleanWorkspace(raw) {
  const w = raw && typeof raw === 'object' && raw.v === 2 ? raw : {}
  return {
    ...EMPTY_WORKSPACE,
    shop: w.shop && typeof w.shop === 'object' && typeof w.shop.name === 'string' ? w.shop : null,
    drops: Array.isArray(w.drops) ? w.drops.filter((d) => d?.drop?.sheet?.rows) : [],
    agent: w.agent && Array.isArray(w.agent.messages) ? { messages: w.agent.messages, state: w.agent.state || {}, chips: w.agent.chips || [] } : EMPTY_WORKSPACE.agent,
    maps: Array.isArray(w.maps) ? w.maps : [],
    basket: Array.isArray(w.basket) ? w.basket.filter((x) => typeof x === 'string') : [],
    sample: typeof w.sample === 'string' ? w.sample : null,
  }
}

/** Two letters for an avatar. */
export const initials = (name = '') => name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '··'

/** A drop the agent just made, as a workspace record. */
export function dropRecord(drop, { name, supplier = '', trace = [] } = {}) {
  return {
    number: drop.number,
    name: name || (drop.whatIf ? `What-if: ${drop.city}` : `Order #${String(drop.number).padStart(2, '0')}`),
    supplier,
    createdAt: drop.at || new Date().toISOString(),
    drop,
    trace,
    calls: {},
  }
}

/** Add or replace a drop record by number. */
export function upsertDrop(drops, record) {
  const rest = drops.filter((d) => d.number !== record.number)
  return [...rest, record].sort((a, b) => a.number - b.number)
}

/** Counts per group, from a drop. */
export function counts(drop) {
  const rows = drop?.sheet?.rows ?? []
  return Object.fromEntries(GROUPS.map((g) => [g, rows.filter((r) => r.group === g).length]))
}

/** The owner's final call for a row: their own if made, otherwise the agent's. */
export const finalCall = (record, row) => record.calls?.[row.id] || row.group

/** Totals for the overview. */
export function overview(ws) {
  const rows = ws.drops.flatMap((d) => d.drop.sheet.rows.filter((r) => r.group !== 'nosignal').map((r) => ({ r, d })))
  const made = rows.filter(({ r, d }) => d.calls?.[r.id])
  const agreed = made.filter(({ r, d }) => d.calls[r.id] === r.group).length
  return {
    drops: ws.drops.length,
    brands: rows.length,
    reviewed: made.length,
    agreement: made.length ? Math.round((agreed / made.length) * 100) : null,
    flips: ws.drops.reduce((n, d) => n + (d.drop.baseline?.flips?.length ?? 0), 0),
    calls: ws.drops.reduce((n, d) => n + (d.trace?.length ?? 0), 0),
  }
}

/** Brands across all drops whose name contains q. */
export function searchBrands(ws, q, max = 8) {
  const needle = q.trim().toLowerCase()
  if (!needle) return []
  const out = []
  for (const d of [...ws.drops].reverse()) {
    for (const r of d.drop.sheet.rows) {
      if (r.name.toLowerCase().includes(needle)) out.push({ name: r.name, group: finalCall(d, r), number: d.number, drop: d.name })
      if (out.length >= max) return out
    }
  }
  return out
}

const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))

/** The drop as CSV: one row per brand with the agent's call, the owner's call and the reasons. */
export function toCsv(record) {
  const head = ['Brand', 'Agent', 'Your call', 'Reasons']
  const rows = record.drop.sheet.rows.map((r) => [r.name, r.group, finalCall(record, r), r.reasons.join(' ')])
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\n')
}

/** Taste and local positions read back out of a row's reasons, for the table. */
export function positions(row) {
  const find = (prefix) => {
    const line = row.reasons.find((x) => x.startsWith(prefix))
    const m = line?.match(/(\d+)\w{2} of (?:the )?(\d+)/)
    return m ? { at: Number(m[1]), of: Number(m[2]) } : null
  }
  return { taste: find('Taste'), place: find('Place') }
}

/** The opening message the agent gets for a new drop. */
export function setupMessage({ city, loves, list }) {
  const parts = []
  if (city) parts.push(`My shop is in ${city}.`)
  // a comma inside a name ("Tyler, the Creator") would split it in two, so it goes
  if (loves?.length) parts.push(`My customers love ${loves.map((l) => l.replace(/,/g, '')).join(', ')}.`)
  return `${parts.join(' ')}\n${list.trim()}`
}

/** A sample workspace built from a recorded example conversation. */
export function sampleWorkspace(example, shop) {
  const drops = []
  const messages = []
  for (const t of example.turns) {
    messages.push({ from: 'me', text: t.message })
    for (const r of t.replies) {
      messages.push(r.type === 'text' ? { from: 'bot', text: r.text } : { from: 'bot', reply: r })
      if (r.type === 'drop') drops.push(dropRecord(r.drop, { name: r.drop.whatIf ? `What-if: ${r.drop.city.split(',')[0]}` : 'Spring order', supplier: 'Sample supplier list', trace: example.trace }))
    }
  }
  const maps = example.turns.flatMap((t) => t.replies).filter((r) => r.type === 'map').map((r) => r.map)
  return { ...EMPTY_WORKSPACE, shop, drops, agent: { messages, state: example.state, chips: example.turns.at(-1).chips }, maps, sample: example.label }
}

/** An order enquiry to the supplier from the owner's final calls. Restocked never sends it; the owner does. */
export function orderDraft(record, shop, { withConsider = true, from = '' } = {}) {
  const rows = record.drop.sheet.rows.filter((r) => r.group !== 'nosignal')
  const pick = (g) => rows.filter((r) => finalCall(record, r) === g).map((r) => r.name)
  const stock = pick('stock')
  const consider = withConsider ? pick('consider') : []
  const who = shop?.name ? `${shop.name}${shop.kind ? `, a ${shop.kind.toLowerCase()}` : ''}${shop.city ? ` in ${shop.city}` : ''}` : 'an independent shop'
  const lines = [
    'Hi,',
    '',
    `I run ${who}. From your current brand list I'd like to place an opening order for:`,
    ...stock.map((n) => `- ${n}`),
  ]
  if (consider.length) lines.push('', "I'm also considering these, depending on minimums:", ...consider.map((n) => `- ${n}`))
  lines.push('', 'Could you send wholesale pricing, opening minimums and lead times for these?', '', 'Thanks,', from || shop?.name || '')
  return {
    subject: `Opening order${shop?.name ? ` for ${shop.name}` : ''}${record.supplier ? ` · ${record.supplier}` : ''}`,
    body: lines.join('\n').trim(),
    stock,
    consider,
  }
}
