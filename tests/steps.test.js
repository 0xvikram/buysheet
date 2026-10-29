import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { agentSteps } from '../lib/steps.js'

test('the steps tell the real run: lookups, both rankings, the result and the flips', () => {
  const ex = JSON.parse(readFileSync(new URL('../public/examples/austin.json', import.meta.url)))
  const drop = ex.turns.flatMap((t) => t.replies).find((r) => r.type === 'drop').drop
  const steps = agentSteps({ drop, trace: ex.trace })
  assert.deepEqual(steps.map((s) => s.kind), ['read', 'qloo', 'qloo', 'qloo', 'decide', 'check'])
  assert.match(steps[1].title, /^Checked \d+ names on Qloo$/)
  assert.match(steps[3].title, /Austin/)
  const c = drop.sheet.counts
  assert.match(steps[4].detail, new RegExp(`${c.stock} stock, ${c.consider} consider, ${c.skip} skip`))
})

test('with no trace it still explains the decision honestly', () => {
  const drop = { city: 'Denver', loves: ['Patagonia'], sheet: { rows: [{ id: '1', name: 'Filson', group: 'stock' }] }, baseline: { flips: [] } }
  const steps = agentSteps({ drop })
  assert.deepEqual(steps.map((s) => s.kind), ['read', 'decide', 'check'])
  assert.match(steps[2].detail, /agrees/)
})
