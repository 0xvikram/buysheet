import { allow, tooMany } from '../../../lib/limit.js'
import { handle } from '../../../lib/mcp.js'
import { runTool } from '../../../lib/mcp-tools.js'

export const maxDuration = 60

// Streamable HTTP: the client POSTs JSON-RPC and gets JSON back. This server keeps no sessions,
// so it does not open event streams.
export async function POST(request) {
  if (!allow(request)) return tooMany()
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400 })
  }
  const run = (name, args) => runTool(name, args)
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handle(m, run)))).filter(Boolean)
    return out.length ? Response.json(out) : new Response(null, { status: 202 })
  }
  const out = await handle(body, run)
  return out ? Response.json(out) : new Response(null, { status: 202 })
}

export function GET() {
  return new Response('This MCP server answers POST requests only.', { status: 405, headers: { Allow: 'POST' } })
}
