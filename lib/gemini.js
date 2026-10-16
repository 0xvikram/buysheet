// "What a plain AI would say": the same question, answered by a language model with no Qloo data.
// It exists so the difference Qloo makes can be seen, and it never feeds the sheet itself.

// Tried in order. The free tier is sometimes overloaded (503) or rate-limited (429).
const MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest']
const endpoint = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function ask(key, body) {
  let last = 0
  for (const model of MODELS) {
    for (const wait of [0, 1500]) {
      if (wait) await sleep(wait)
      let response
      try {
        response = await fetch(endpoint(model), {
          method: 'POST',
          headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(12000), // never leave the page waiting on a slow model
        })
      } catch {
        last = 504
        break // this model is too slow right now; try the next one
      }
      if (response.ok) return { data: await response.json(), model }
      last = response.status
      if (![429, 500, 503].includes(last)) return { status: last }
    }
  }
  return { status: last }
}

const list = { type: 'ARRAY', items: { type: 'STRING' } }
const SCHEMA = {
  type: 'OBJECT',
  properties: { stock: list, consider: list, skip: list },
  required: ['stock', 'consider', 'skip'],
}

export async function plainGuess({ brands, signals, city }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { available: false, why: 'No language-model key is set on the server.' }
  const prompt = [
    'You advise an independent shop on which brands to stock.',
    city ? `The shop is in ${city}.` : '',
    signals.length ? `Its customers love: ${signals.join(', ')}.` : '',
    `Sort every one of these brands into stock, consider or skip for this shop: ${brands.join(', ')}.`,
    'Use each brand name exactly as written. Put each brand in exactly one group. Aim for groups of similar size.',
  ].filter(Boolean).join(' ')
  try {
    const { data, model, status } = await ask(key, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA },
    })
    if (!data) return { available: false, why: `The language model answered ${status}.` }
    const groups = JSON.parse(data.candidates[0].content.parts[0].text)
    const known = new Set(brands)
    const clean = (names) => [...new Set(names)].filter((n) => known.has(n))
    return {
      available: true,
      model: data.modelVersion || model,
      groups: { stock: clean(groups.stock), consider: clean(groups.consider), skip: clean(groups.skip) },
    }
  } catch {
    return { available: false, why: 'The language model could not be reached.' }
  }
}

/** For each brand, did the plain guess and the Qloo sheet agree? */
export function compare(sheetRows, guess) {
  const guessed = {}
  for (const [group, names] of Object.entries(guess)) for (const n of names) guessed[n] = group
  const rated = sheetRows.filter((r) => r.group !== 'nosignal' && guessed[r.name])
  const differs = rated.filter((r) => guessed[r.name] !== r.group)
  const opposite = differs.filter((r) => new Set([guessed[r.name], r.group]).has('stock') && new Set([guessed[r.name], r.group]).has('skip'))
  return {
    compared: rated.length,
    same: rated.length - differs.length,
    opposite: opposite.map((r) => ({ name: r.name, qloo: r.group, plain: guessed[r.name] })),
    guessed,
  }
}
