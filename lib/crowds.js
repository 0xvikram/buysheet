// The "without Qloo" comparison: the same supplier list sorted for several shops.
// A bestseller list (popularity only) gives every shop the same answer; Restocked's call
// changes with each shop's crowd and city. Pure: works on recorded drops.

/**
 * shops: [{ id, label, drop }] where every drop sorted the same list.
 * Returns the brands every shop has, each with the bestseller call and each shop's call,
 * plus how many brands got different calls across shops (the bestseller list: always 0).
 */
export function compareCrowds(shops) {
  const byName = (drop) => Object.fromEntries(drop.sheet.rows.map((r) => [r.name, r]))
  const maps = shops.map((s) => byName(s.drop))
  const names = Object.keys(maps[0]).filter((n) => maps.every((m) => m[n] && m[n].group !== 'nosignal'))
  const generic = shops[0].drop.baseline?.generic ?? {}
  const brands = names.map((name) => {
    const calls = Object.fromEntries(shops.map((s, i) => [s.id, maps[i][name].group]))
    const distinct = new Set(Object.values(calls)).size
    return { name, generic: generic[maps[0][name].id] ?? null, calls, distinct }
  })
  brands.sort((a, b) => b.distinct - a.distinct || a.name.localeCompare(b.name))
  return { brands, changed: brands.filter((b) => b.distinct > 1).length, total: brands.length }
}
