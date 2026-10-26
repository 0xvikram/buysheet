// Share links for a drop. With no database yet, the drop itself travels in the link:
// title, city, number and the brand names in each group. Reasons stay with the owner.
// Pure: works the same in the browser and on the server.

const GROUP_KEYS = ['stock', 'consider', 'skip', 'nosignal']
const MAX_CODE = 3000

const toB64url = (text) => {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromB64url = (code) => {
  const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** drop -> short url-safe code */
export function encodeDrop(drop) {
  const rows = drop.sheet?.rows ?? []
  const g = GROUP_KEYS.map((k) => rows.filter((r) => r.group === k).map((r) => r.name))
  return toB64url(JSON.stringify({ v: 1, n: drop.number ?? 1, t: drop.title ?? '', c: drop.city ?? '', w: drop.whatIf ? 1 : 0, g }))
}

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '')

/** code -> a drop shaped like the app's (rows without reasons), or null if the code is not ours. */
export function decodeDrop(code) {
  if (typeof code !== 'string' || !code || code.length > MAX_CODE || !/^[A-Za-z0-9_-]+$/.test(code)) return null
  let data
  try {
    data = JSON.parse(fromB64url(code))
  } catch {
    return null
  }
  if (data?.v !== 1 || !Array.isArray(data.g)) return null
  const rows = []
  GROUP_KEYS.forEach((group, i) => {
    const names = Array.isArray(data.g[i]) ? data.g[i] : []
    for (const name of names.slice(0, 40)) {
      const n = str(name, 60)
      if (n) rows.push({ id: `${group}:${n}`, name: n, group, reasons: [] })
    }
  })
  if (!rows.length) return null
  const counts = Object.fromEntries(GROUP_KEYS.map((k) => [k, rows.filter((r) => r.group === k).length]))
  const number = Number.isInteger(data.n) && data.n > 0 && data.n < 1000 ? data.n : 1
  return { number, title: str(data.t, 140), city: str(data.c, 80), whatIf: data.w === 1, sheet: { rows, counts } }
}
