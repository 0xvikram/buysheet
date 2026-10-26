// Reading what a shop owner typed. Pure: no network, no language model.
//
// The agent plans with fixed rules, so this file decides which job a message is asking for
// and pulls out the city, the brands and the names it needs. What it cannot read, it says so.

const clean = (s) =>
  s
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’.!?,;:]+$/g, '')
    .replace(/^(?:and|also|plus|the brand|brands?)\s+/i, '')
    .trim()

/** "Patagonia, Carhartt and Tyler Childers" -> three names. */
export function splitNames(text) {
  return text
    .split(/\s*(?:,|;|\/|\band\b|&|\+)\s*/i)
    .map(clean)
    .filter((n) => n && n.length <= 60 && !/^(?:etc|stuff|things|more)$/i.test(n))
}

// A line in a pasted list is short and has no sentence verbs.
const LISTY = /^[^.!?]{1,48}$/
const PROSE = /\b(?:my|our|we|i|is|are|love|loves|like|likes|what|why|who|shop|store)\b/i

/** Pull a pasted brand list out of a message, leaving the prose behind. */
export function extractList(text) {
  const lines = text.split(/\n+/).map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, '').trim()).filter(Boolean)
  const listy = lines.filter((l) => LISTY.test(l) && !PROSE.test(l))
  if (listy.length >= 3) {
    return { names: listy.map(clean).filter(Boolean), rest: lines.filter((l) => !listy.includes(l)).join('\n') }
  }
  // "Sort these: Baggu, Aesop, Filson"
  const colon = text.match(/^(.*?):\s*([^:]+)$/s)
  if (colon) {
    const names = splitNames(colon[2])
    if (names.length >= 3) return { names, rest: colon[1] }
  }
  return { names: [], rest: text }
}

const CITY_STOP = /\s+(?:and|but|where|whose|with|that|which|so|my|our)\b.*$/i

function cityFrom(sentence) {
  const m = sentence.match(
    /\b(?:shop|store|boutique|business|space|place|we|we're|we are|i|i'm|i am|located|based)\b[^.?!]*?\b(?:in|based in|located in|out of)\s+([^.?!;]+)/i,
  )
  if (!m) return null
  const city = clean(m[1].replace(CITY_STOP, ''))
  return city && city.length <= 60 ? city : null
}

function lovesFrom(sentence) {
  const m = sentence.match(
    /\b(?:customers?|crowd|shoppers?|people|regulars|clients?|clientele|they|folks|buyers)\b[^.?!]*?\b(?:love|loves|like|likes|are into|is into|buy|buys|go for|swear by|listen to|watch)\s+([^.?!]+)/i,
  )
  return m ? splitNames(m[1]).slice(0, 5) : []
}

/** Find a brand from the last drop that the message mentions. */
function mentioned(text, rows = []) {
  const low = text.toLowerCase()
  return [...rows].sort((a, b) => b.name.length - a.name.length).find((r) => low.includes(r.name.toLowerCase())) || null
}

/**
 * Decide what the message asks for.
 * Returns { intent, ...details }. Intents:
 *   answer   { yes }                  reply to "did you mean X?"
 *   setup    { city, loves, names, go } details about the shop and/or a brand list
 *   whatif   { city }                 the same list for another city
 *   explain  { brand | name }         why a brand landed where it did
 *   compare  { a, b }                 two brands side by side
 *   audience { name }                 who buys a brand
 *   similar  { names }                brands this crowd also loves (names may be empty: use the shop's)
 *   map      { name }                 where one brand fits across US cities
 *   sort     {}                       run the saved list again
 *   ("add X and Y to my list" is a setup with names)
 *   help     {}
 */
export function parse(text, state = {}) {
  const raw = String(text || '').trim()
  const low = raw.toLowerCase()

  if (state.pending?.length) {
    if (/^(?:y|yes|yeah|yep|yup|correct|right|sure|that'?s (?:it|right|the one))\b/i.test(raw)) return { intent: 'answer', yes: true }
    if (/^(?:n|no|nope|nah|wrong|not (?:it|that|right))\b/i.test(raw)) return { intent: 'answer', yes: false }
  }

  if (!raw || /^(?:help|\?|what can you do|how does this work|hi|hello|hey)\b/i.test(raw)) return { intent: 'help' }

  const one = raw.replace(/\s+/g, ' ')

  const add = one.match(/^(?:please\s+)?(?:add|include|put)\s+(.+?)(?:\s+(?:to|on|in|into)\s+(?:my|the)\s+(?:list|order|drop|sheet))?[.!]?$/i)
  if (add && !/\bwhat if\b/i.test(one)) return { intent: 'setup', city: null, loves: [], names: splitNames(add[1]), go: true }

  const whatif = one.match(/\b(?:what if|suppose|imagine)\b.*?\b(?:in|to)\s+([^?.!]+)/i)
    || one.match(/\b(?:move|moved|moving|open|opened|opening|relocate|relocated|relocating|second (?:shop|store|location))\b.*?\b(?:in|to)\s+([^?.!]+)/i)
  if (whatif && !cityFrom(one.replace(whatif[0], ''))) return { intent: 'whatif', city: clean(whatif[1].replace(CITY_STOP, '')) }

  const where = one.match(/\bwhere\s+(?:does|do|would|will|is|are|could)\s+(.+?)\s+(?:fit|sell|work|do well|land|play|go down|popular|big|strongest)\b/i)
    || one.match(/\bwhere\s+(?:should|could|can)\s+(?:i|we)\s+(?:sell|stock|carry|pitch|launch)\s+([^?.!]+)/i)
    || one.match(/\b(?:best|top)\s+(?:us\s+)?cities\s+for\s+([^?.!]+)/i)
    || one.match(/^(?:show\s+(?:me\s+)?)?(?:a\s+|the\s+)?(?:city\s+)?map\s+(?:of|for)\s+([^?.!]+)/i)
  if (where) return { intent: 'map', name: clean(where[1]) }

  const versus = one.match(/^(?:compare\s+)?(.+?)\s+(?:vs\.?|versus)\s+(.+?)$/i)
    || one.match(/^compare\s+(.+?)\s+(?:and|with|to)\s+(.+?)$/i)
    || one.match(/^(?:is|are|should i (?:stock|carry|pick|go with))?\s*(.+?)\s+or\s+(.+?)(?:\s+(?:a\s+)?(?:better|stronger)\b.*)?\??$/i)
  if (versus && /\b(?:vs|versus|compare|or)\b/i.test(one) && !/\bwhy\b/i.test(one)) {
    const a = clean(versus[1].replace(/^(?:which is better|which fits better|which one|better fit)\s*[:,-]?\s*/i, ''))
    const b = clean(versus[2])
    if (a && b && a.split(' ').length <= 5 && b.split(' ').length <= 5) return { intent: 'compare', a, b }
  }

  const who = one.match(/\bwho\s+(?:buys|likes|loves|shops|wears|is into|are into|goes for|uses)\s+([^?.!]+)/i)
    || one.match(/\b(?:audience|customers|crowd|fans)\s+(?:for|of)\s+([^?.!]+)/i)
  if (who) return { intent: 'audience', name: clean(who[1]) }

  const like = one.match(/\b(?:brands?|more|something|anything|stuff|labels?)\s+(?:like|similar to)\s+([^?.!]+)/i)
    || one.match(/\bsimilar to\s+([^?.!]+)/i)
  if (like) return { intent: 'similar', names: splitNames(like[1]).slice(0, 5) }
  if (/\b(?:find|suggest|recommend|discover|show)\b.*\b(?:new|other|more)\b.*\bbrands?\b/i.test(one)) return { intent: 'similar', names: [] }

  if (/\bwhy\b/i.test(one)) {
    const brand = mentioned(one, state.drop?.sheet?.rows)
    if (brand) return { intent: 'explain', brand }
    const m = one.match(/\bwhy\b(?:\s+(?:is|did|does|do|are|should|would))?(?:\s+(?:you|it|i))?(?:\s+(?:skip|stock|consider|drop|cut|pick|put|rank|say))?\s+(.+?)(?:\s+(?:in|on|as|into|so|at)\b.*)?\??$/i)
    return { intent: 'explain', name: m ? clean(m[1]) : '' }
  }

  // Setup: a pasted list, the shop's place, the customers' favourites, in any combination.
  const { names, rest } = extractList(raw)
  const sentences = rest.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean)
  let city = null
  let loves = []
  for (const s of sentences) {
    city = city || cityFrom(s)
    if (!loves.length) loves = lovesFrom(s)
  }
  const go = /\b(?:sort|rank|check|run|build|make|go|do it|score|grade)\b/i.test(rest)
  if (names.length || city || loves.length) return { intent: 'setup', city, loves, names, go }
  if (go && state.list?.length) return { intent: 'sort' }
  return { intent: 'help', unclear: true }
}
