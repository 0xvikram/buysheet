// Record the example conversations the app and landing page show, by running the real agent
// against the live Qloo API once. Nothing here is hand-written output.
//   node scripts/examples.mjs            (all)
//   node scripts/examples.mjs austin     (just one)
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
      'Where does Filson fit?',
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

// The feed: more sample shops, one message each, on the same supplier list.
// When Qloo is unsure, the answer is yes only if its match starts with the typed name
// ("Le Labo" -> "Le Labo Fragrances"); anything else is left out rather than guessed.
const LIST = 'Baggu\nRifle Paper Co.\nLe Labo\nBoy Smells\nOtherland\nAesop\nMoleskine\nStanley\nHydro Flask\nHerschel Supply Co\nTopo Designs\nCotopaxi\nSnow Peak\nFilson\nBlundstone\nBirkenstock\nGirlfriend Collective\nPaloma Wool\nGanni\nRains\nBellroy\nFjällräven\nOur Place\nHAY\nGlossier'
const FEED = {
  austin: { label: 'Gift and lifestyle shop, Austin', turns: [`We run a gift shop in Austin, Texas. Our customers love YETI, Willie Nelson and Leon Bridges.\n${LIST}`] },
  portland: { label: 'Makers and outdoor shop, Portland', turns: [`My shop is in Portland, Oregon. My regulars love Pendleton, Phoebe Bridgers and Portlandia.\n${LIST}`] },
  nashville: { label: 'General store, Nashville', turns: [`I run a general store in Nashville, Tennessee. My customers love Chris Stapleton, Kacey Musgraves and Yellowstone.\n${LIST}`] },
  losangeles: { label: 'Beauty and gift boutique, Los Angeles', turns: [`Our boutique is in Los Angeles. Our customers love Skims, Bad Bunny and Euphoria.\n${LIST}`] },
}
for (const [name, ex] of Object.entries(FEED)) EXAMPLES[name] = { ...ex, declinePending: true }

const only = process.argv.slice(2)
for (const [name, ex] of Object.entries(EXAMPLES).filter(([n]) => !only.length || only.includes(n))) {
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
    while (ex.declinePending && state.pending.length) {
      const asked = state.pending[0]
      const no = asked.pick.name.toLowerCase().startsWith(asked.typed.toLowerCase()) ? "Yes, that's it" : 'No, leave it out'
      const t2 = []
      const out2 = await respond(no, state, t2)
      state = out2.state
      trace.push(...t2)
      turns.push({ message: no, replies: out2.replies, chips: out2.chips })
      console.log(`${name} > ${no} -> ${out2.replies.map((r) => r.type).join(', ')}`)
    }
  }
  writeFileSync(
    new URL(`../public/examples/${name}.json`, import.meta.url),
    JSON.stringify({ label: ex.label, recordedOn: new Date().toISOString().slice(0, 10), turns, state, trace }),
  )
}
