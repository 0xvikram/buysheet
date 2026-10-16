// Turning Qloo's answers into a buy sheet. Pure functions: no network.
//
// Two separate questions are asked, and each brand is read on both:
//   taste: among fans of what this shop's customers love, how does the brand place on this list?
//   place: among people in this city, how does it place?
// They are kept apart for two reasons. Qloo's scores are only comparable inside one answer,
// so we use positions, never raw scores across answers. And when a city is given, Qloo only
// returns brands it has local data for, so a combined question silently drops the rest.

export const GROUPS = {
  stock: 'Stock',
  consider: 'Consider',
  skip: 'Skip',
  nosignal: 'No signal',
}

const ORDINAL = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

/** 0 = top third, 1 = middle, 2 = bottom third. */
export function third(position, total) {
  if (position < total / 3) return 0
  return position < (2 * total) / 3 ? 1 : 2
}

/**
 * One brand's group from its two readings (each 0, 1, 2, or null when Qloo returned nothing).
 * Taste leads. A strong local reading lifts a brand one step; a weak one lowers it one step.
 * A missing reading never counts against a brand.
 */
export function decide(taste, place) {
  if (taste === null && place === null) return 'nosignal'
  if (taste === null) return ['stock', 'consider', 'skip'][place]
  let step = taste
  if (place === 0) step -= 1
  if (place === 2) step += 1
  return ['stock', 'consider', 'skip'][Math.max(0, Math.min(2, step))]
}

/** The signal that contributed most to a brand's place, as { name, share } or null. */
export function strongestSignal(explainability, signalNames) {
  const parts = explainability?.['signal.interests.entities'] || []
  const known = parts.filter((p) => signalNames[p.entity_id])
  if (!known.length) return null
  const total = known.reduce((sum, p) => sum + p.score, 0) || 1
  const top = known.reduce((a, b) => (b.score > a.score ? b : a))
  return { name: signalNames[top.entity_id], share: Math.round((top.score / total) * 100) }
}

/**
 * Build the sheet.
 * @param brands      [{ id, name }] the confirmed brands from the supplier list
 * @param byTaste     Qloo entities ranked for the customers' taste (best first); empty if no taste given
 * @param byPlace     Qloo entities ranked for the city (best first); empty if no city given
 * @param signalNames { entityId: 'Patagonia' } for the things the shop's customers love
 */
export function buildSheet({ brands, byTaste, byPlace, signalNames, city }) {
  const onList = new Set(brands.map((b) => b.id))
  const taste = byTaste.filter((e) => onList.has(e.entity_id))
  const place = byPlace.filter((e) => onList.has(e.entity_id))
  const tastePos = new Map(taste.map((e, i) => [e.entity_id, i]))
  const placePos = new Map(place.map((e, i) => [e.entity_id, i]))
  const explain = new Map(taste.map((e) => [e.entity_id, e.query?.explainability]))
  const askedTaste = Object.keys(signalNames).length > 0
  const askedPlace = Boolean(city)

  const rows = brands.map((brand) => {
    const t = tastePos.get(brand.id)
    const p = placePos.get(brand.id)
    const reasons = []
    if (askedTaste) {
      if (t === undefined) reasons.push("Taste: Qloo returned nothing for this brand among your customers' favourites.")
      else {
        reasons.push(`Taste: ${ORDINAL(t + 1)} of ${taste.length} brands on this list among fans of what your customers love.`)
        const signal = strongestSignal(explain.get(brand.id), signalNames)
        if (signal) reasons.push(`The strongest link is to fans of ${signal.name} (${signal.share}% of the match).`)
      }
    }
    if (askedPlace) {
      reasons.push(
        p === undefined
          ? `Place: Qloo has no local reading for this brand in ${city}. That is missing data and does not count against it.`
          : `Place: ${ORDINAL(p + 1)} of the ${place.length} brands on this list that Qloo has a local reading for in ${city}.`,
      )
    }
    const group = decide(
      t === undefined ? null : third(t, taste.length),
      p === undefined ? null : third(p, place.length),
    )
    if (group === 'nosignal') reasons.push('With no reading at all, this brand is left unjudged.')
    return { ...brand, group, taste: t === undefined ? null : t + 1, place: p === undefined ? null : p + 1, reasons }
  })

  const order = { stock: 0, consider: 1, skip: 2, nosignal: 3 }
  const rank = (r) => r.taste ?? r.place ?? 999
  rows.sort((a, b) => order[a.group] - order[b.group] || rank(a) - rank(b))
  return {
    rows,
    counts: Object.fromEntries(Object.keys(GROUPS).map((g) => [g, rows.filter((r) => r.group === g).length])),
    read: { taste: taste.length, place: place.length, of: brands.length },
  }
}
