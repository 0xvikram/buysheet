// Turning a typed name into a Qloo entity, and saying honestly how sure we are.
// Pure functions: no network.

/** Lower-case, strip accents and punctuation, so "Fjällräven" and "fjallraven" compare equal. */
export function normalize(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

/** One name per line or comma; trims, drops blanks and repeats, keeps the first 60. */
export function parseList(text) {
  const seen = new Set()
  const out = []
  for (const raw of text.split(/[\n,;]+/)) {
    const name = raw.replace(/^\s*[-•*\d.)]+\s*/, '').trim()
    const key = normalize(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out.slice(0, 60)
}

function describe(entity) {
  const text = entity.properties?.short_description || entity.disambiguation || ''
  return text.length > 110 ? `${text.slice(0, 107)}…` : text
}

function candidate(entity) {
  return {
    id: entity.entity_id,
    name: entity.name,
    kind: (entity.types?.[0] || '').replace('urn:entity:', ''),
    about: describe(entity),
  }
}

/**
 * Decide what a search result means for the name the owner typed.
 *  - matched: a result has the same name. Used without asking.
 *  - check:   only a partial name match ("Kapital" → "Kapital Bank"). The owner must confirm.
 *  - unknown: nothing plausible. Never guessed.
 */
export function judgeMatch(typed, results) {
  const key = normalize(typed)
  const exact = results.find((r) => normalize(r.name) === key)
  if (exact) return { typed, state: 'matched', pick: candidate(exact), options: [] }
  const partial = results.filter((r) => {
    const other = normalize(r.name)
    return other.includes(key) || key.includes(other)
  })
  if (partial.length) {
    return { typed, state: 'check', pick: candidate(partial[0]), options: partial.slice(0, 3).map(candidate) }
  }
  return { typed, state: 'unknown', pick: null, options: [] }
}
