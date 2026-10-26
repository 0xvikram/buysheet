// Small text helpers shared by the agent and the tools. Pure.

export const list = (names) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

const AGE = {
  '24_and_younger': 'under 25', '25_to_29': '25 to 29', '30_to_34': '30 to 34',
  '35_to_44': '35 to 44', '45_to_54': '45 to 54', '55_and_older': '55 and over',
}

/** Turn Qloo's lean numbers into one sentence. Only clear leans (|x| >= 0.25) are named. */
export function describeLean(query) {
  if (!query) return 'Qloo has no audience reading for this brand.'
  const ages = Object.entries(query.age ?? {})
  const over = ages.filter(([, v]) => v >= 0.25).sort((a, b) => b[1] - a[1]).map(([k]) => AGE[k] ?? k)
  const under = ages.filter(([, v]) => v <= -0.25).sort((a, b) => a[1] - b[1]).map(([k]) => AGE[k] ?? k)
  const g = query.gender ?? {}
  const parts = []
  if (over.length) parts.push(`leans ${list(over)}`)
  if (Math.abs(g.male ?? 0) >= 0.25) parts.push(`leans ${(g.male ?? 0) > 0 ? 'male' : 'female'}`)
  if (!parts.length) return 'The audience is broad, with no clear age or gender lean.'
  const tail = under.length ? `, and is light on people ${list(under)}` : ''
  return `The audience ${list(parts)}${tail}.`
}
