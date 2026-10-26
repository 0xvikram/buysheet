// Record the example conversations the app and landing page show, by running the real agent
// against the live Qloo API once. Nothing here is hand-written output.
//   node scripts/examples.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'

const keyFile = `${homedir()}/.config/qloo.key`
if (!process.env.QLOO_API_KEY && existsSync(keyFile)) process.env.QLOO_API_KEY = readFileSync(keyFile, 'utf8').trim()
const { respond } = await import('../lib/agent.js')

const EXAMPLES = {
  denver: {
    label: 'Outdoor-leaning gift shop, Denver',
    turns: [
      'I run a gift shop in Denver, Colorado. My customers love Patagonia, Carhartt and Tyler Childers.\nBaggu\nRifle Paper Co.\nLe Labo\nBoy Smells\nOtherland\nAesop\nMoleskine\nStanley\nHydro Flask\nHerschel Supply Co\nTopo Designs\nCotopaxi\nSnow Peak\nFilson\nBlundstone\nBirkenstock\nGirlfriend Collective\nPaloma Wool\nGanni\nRains\nBellroy\nFjällräven\nKapital\nGraza\nOur Place\nHAY\nGlossier',
      "Yes, that's it",
      'No, leave it out',
      'Why skip Baggu?',
      'What if I opened in Austin?',
    ],
  },
  brooklyn: {
    label: 'Apothecary and gift shop, Brooklyn',
    turns: [
      'My shop is in Brooklyn, New York. Our regulars love Glossier, Aesop and Phoebe Bridgers.\nBaggu\nRifle Paper Co.\nLe Labo\nBoy Smells\nOtherland\nMoleskine\nStanley\nHydro Flask\nHerschel Supply Co\nTopo Designs\nCotopaxi\nSnow Peak\nFilson\nBlundstone\nBirkenstock\nGirlfriend Collective\nPaloma Wool\nGanni\nRains\nBellroy\nFjällräven\nOur Place\nHAY',
      "Yes, that's it",
      'Le Labo vs Byredo',
      'Find me new brands for my crowd',
    ],
  },
}

for (const [name, ex] of Object.entries(EXAMPLES)) {
  let state = {}
  const turns = []
  const trace = []
  for (const message of ex.turns) {
    const t = []
    const out = await respond(message, state, t)
    state = out.state
    trace.push(...t)
    turns.push({ message, replies: out.replies, chips: out.chips })
    console.log(`${name} > ${message.split('\n')[0].slice(0, 60)} -> ${out.replies.map((r) => r.type).join(', ')}`)
  }
  writeFileSync(
    new URL(`../public/examples/${name}.json`, import.meta.url),
    JSON.stringify({ label: ex.label, recordedOn: new Date().toISOString().slice(0, 10), turns, state, trace }),
  )
}
