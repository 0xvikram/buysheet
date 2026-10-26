import test from 'node:test'
import assert from 'node:assert/strict'
import { handle, TOOLS, VERSIONS } from '../lib/mcp.js'

const run = async (name, args) => ({ text: `ran ${name}`, data: { args } })

test('initialize agrees a protocol version and advertises tools', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } }, run)
  assert.equal(r.result.protocolVersion, '2025-03-26')
  assert.deepEqual(r.result.capabilities, { tools: { listChanged: false } })
  const odd = await handle({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } }, run)
  assert.equal(odd.result.protocolVersion, VERSIONS[0])
})

test('notifications get no reply', async () => {
  assert.equal(await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }, run), null)
})

test('tools/list returns the five tools with schemas', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 3, method: 'tools/list' }, run)
  assert.deepEqual(r.result.tools.map((t) => t.name), ['sort_brand_list', 'find_similar_brands', 'describe_audience', 'map_brand_cities', 'compare_brands'])
  assert.ok(TOOLS.every((t) => t.inputSchema.type === 'object' && t.description))
})

test('tools/call runs the tool and returns text plus structured data', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'describe_audience', arguments: { brand: 'Filson' } } }, run)
  assert.equal(r.result.isError, false)
  assert.deepEqual(r.result.content, [{ type: 'text', text: 'ran describe_audience' }])
  assert.deepEqual(r.result.structuredContent, { args: { brand: 'Filson' } })
})

test('missing arguments and tool failures come back as tool errors, not crashes', async () => {
  const missing = await handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'compare_brands', arguments: { a: 'X' } } }, run)
  assert.equal(missing.result.isError, true)
  assert.match(missing.result.content[0].text, /Missing: b/)
  const boom = await handle({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'describe_audience', arguments: { brand: 'X' } } }, async () => { throw Object.assign(new Error('x'), { publicMessage: 'Qloo is busy.' }) })
  assert.deepEqual(boom.result, { isError: true, content: [{ type: 'text', text: 'Qloo is busy.' }] })
})

test('unknown tools and methods are protocol errors', async () => {
  assert.equal((await handle({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'nope' } }, run)).error.code, -32602)
  assert.equal((await handle({ jsonrpc: '2.0', id: 8, method: 'resources/list' }, run)).error.code, -32601)
  assert.equal((await handle({ id: 9, method: 'x' }, run)).error.code, -32600)
})
