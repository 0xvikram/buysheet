// A small MCP server (Model Context Protocol, Streamable HTTP, stateless JSON responses).
// It offers the agent's tools to any AI assistant, which brings its own language model.
// The JSON-RPC handling is pure; the tool functions are passed in so it can be tested.
import { BRAND } from './brand.js'

export const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']

const names = (description, max) => ({ type: 'array', items: { type: 'string' }, maxItems: max, description })

export const TOOLS = [
  {
    name: 'sort_brand_list',
    title: 'Sort a brand list for a shop',
    description:
      "Sort a supplier's brand list into stock / consider / skip for one independent shop, using Qloo's taste data for the shop's city and for what its customers already love. Brands Qloo cannot match exactly are reported back for confirmation instead of guessed; pass them in `confirmed` to include them.",
    inputSchema: {
      type: 'object',
      properties: {
        brands: names('Brand names from the supplier list.', 40),
        city: { type: 'string', description: 'Where the shop is, e.g. "Denver, Colorado".' },
        customers_love: names("Brands, musicians, shows or films the shop's customers already love.", 5),
        confirmed: names('Names from a previous `needs_confirmation` list that the owner confirmed.', 40),
      },
      required: ['brands'],
    },
  },
  {
    name: 'find_similar_brands',
    title: 'Find brands this crowd also loves',
    description: 'Brands that fans of the given brands, musicians, shows or films also love, leaving out the most famous names.',
    inputSchema: {
      type: 'object',
      properties: { customers_love: names('What the crowd already loves.', 5), exclude: names('Brands to leave out, such as ones already stocked.', 40) },
      required: ['customers_love'],
    },
  },
  {
    name: 'describe_audience',
    title: 'Who buys a brand',
    description: "A brand's audience: which age bands and gender it leans towards, from Qloo's aggregate data.",
    inputSchema: { type: 'object', properties: { brand: { type: 'string' } }, required: ['brand'] },
  },
  {
    name: 'map_brand_cities',
    title: 'Where a brand fits across US cities',
    description: "One brand's local reading in 12 US cities (Seattle to Miami), ranked against each other: strong, fair or weak fit, or no local data. Useful for choosing where to open, sell or pitch.",
    inputSchema: { type: 'object', properties: { brand: { type: 'string' } }, required: ['brand'] },
  },
  {
    name: 'compare_brands',
    title: 'Compare two brands',
    description: 'Two brands side by side: who buys each and which traits set each audience apart.',
    inputSchema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } }, required: ['a', 'b'] },
  },
]

const ok = (id, result) => ({ jsonrpc: '2.0', id, result })
const err = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } })

/**
 * Handle one JSON-RPC message. Returns the response object, or null for notifications.
 * `run(name, args)` executes a tool and resolves to { text, data }.
 */
export async function handle(message, run) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return err(message?.id ?? null, -32600, 'Invalid request')
  const { id, method, params = {} } = message
  if (id === undefined || id === null) return null // a notification: nothing to send back

  if (method === 'initialize') {
    const asked = params.protocolVersion
    return ok(id, {
      protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: BRAND.slug, title: BRAND.name, version: '0.2.0' },
      instructions: `${BRAND.name} helps independent shops decide which brands to stock. Start with sort_brand_list. Results describe what groups of people tend to like, not sales forecasts.`,
    })
  }
  if (method === 'ping') return ok(id, {})
  if (method === 'tools/list') return ok(id, { tools: TOOLS })
  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params.name)
    if (!tool) return err(id, -32602, `Unknown tool: ${params.name}`)
    const args = params.arguments ?? {}
    const missing = tool.inputSchema.required.filter((k) => args[k] === undefined || args[k] === '' || (Array.isArray(args[k]) && !args[k].length))
    if (missing.length) return ok(id, { isError: true, content: [{ type: 'text', text: `Missing: ${missing.join(', ')}` }] })
    try {
      const { text, data } = await run(tool.name, args)
      return ok(id, { content: [{ type: 'text', text }], structuredContent: data, isError: false })
    } catch (e) {
      return ok(id, { isError: true, content: [{ type: 'text', text: e.publicMessage || 'The tool failed. Try again in a minute.' }] })
    }
  }
  return err(id, -32601, `Method not found: ${method}`)
}
