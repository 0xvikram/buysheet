// Turning Qloo search results into suggestions for the shop setup form. Pure.

const COUNTRY = { 'United States of America': 'US', 'United States': 'US', 'United Kingdom': 'UK' }
const TYPE = { 'urn:entity:brand': 'Brand', 'urn:entity:artist': 'Artist', 'urn:entity:tv_show': 'TV show', 'urn:entity:movie': 'Film' }

/** "Austin, Travis, Texas, United States of America" -> "Austin, Texas, US". */
export function placeLabel(name, disambiguation) {
  const parts = String(disambiguation || name || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!parts.length) return name || ''
  const country = parts.at(-1)
  const region = parts.length > 2 ? parts.at(-2) : null
  const short = COUNTRY[country] || country
  return [name || parts[0], region && region !== (name || parts[0]) ? region : null, parts.length > 1 ? short : null].filter(Boolean).join(', ')
}

/** Distinct places, best match first, labelled for a dropdown. */
export function placeOptions(results, max = 6) {
  const seen = new Set()
  const out = []
  for (const r of results) {
    const label = placeLabel(r.name, r.disambiguation)
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({ label, name: r.name })
    if (out.length >= max) break
  }
  return out
}

/** Brands, artists, shows and films for "customers love", most popular first, no exact repeats. */
export function loveOptions(results, max = 6) {
  const seen = new Set()
  return results
    .filter((r) => r.name)
    .map((r) => ({ name: r.name, type: TYPE[r.types?.[0]] || 'Other', popularity: r.popularity ?? 0, about: (r.properties?.short_description || '').slice(0, 70) }))
    .filter((r) => r.popularity > 0.3)
    .sort((a, b) => b.popularity - a.popularity)
    .filter((r) => { const k = `${r.name.toLowerCase()}|${r.type}`; if (seen.has(k)) return false; seen.add(k); return true })
    .slice(0, max)
}
