// Where one brand fits across US cities. Pure: no network.
//
// Qloo's local readings (affinity) are only compared with each other, never read as absolute:
// a brand is strong in the cities in the top third of its own readings, weak in the bottom third.
// A city with no reading is shown as "no local data", never as weak.
import { third } from './grade.js'
import { list } from './words.js'

export const CITIES = [
  { name: 'Seattle', query: 'Seattle', lat: 47.61, lon: -122.33 },
  { name: 'Portland', query: 'Portland, Oregon', lat: 45.52, lon: -122.68 },
  { name: 'San Francisco', query: 'San Francisco', lat: 37.77, lon: -122.42 },
  { name: 'Los Angeles', query: 'Los Angeles', lat: 34.05, lon: -118.24 },
  { name: 'Denver', query: 'Denver', lat: 39.74, lon: -104.99 },
  { name: 'Austin', query: 'Austin', lat: 30.27, lon: -97.74 },
  { name: 'Minneapolis', query: 'Minneapolis', lat: 44.98, lon: -93.27 },
  { name: 'Chicago', query: 'Chicago', lat: 41.88, lon: -87.63 },
  { name: 'Nashville', query: 'Nashville', lat: 36.16, lon: -86.78 },
  { name: 'Atlanta', query: 'Atlanta', lat: 33.75, lon: -84.39 },
  { name: 'Miami', query: 'Miami', lat: 25.76, lon: -80.19 },
  { name: 'New York', query: 'New York', lat: 40.71, lon: -74.01 },
]

export const FITS = { strong: 'Strong fit', fair: 'Fair fit', weak: 'Weak fit', none: 'No local data' }

/**
 * readings: [{ name, lat, lon, affinity }] with affinity a number or null.
 * Returns the same cities, best first, each with `fit` and `rank` (1-based, null without a reading).
 */
export function readCities(readings) {
  const read = readings.filter((r) => typeof r.affinity === 'number').sort((a, b) => b.affinity - a.affinity)
  const rows = read.map((r, i) => ({ ...r, rank: i + 1, fit: ['strong', 'fair', 'weak'][third(i, read.length)] }))
  for (const r of readings) if (typeof r.affinity !== 'number') rows.push({ ...r, affinity: null, rank: null, fit: 'none' })
  return rows
}

/** One sentence about the map. */
export function cityText(brand, rows) {
  const names = (fit) => rows.filter((r) => r.fit === fit).map((r) => r.name)
  const read = rows.filter((r) => r.fit !== 'none')
  if (!read.length) return `Qloo has no local readings for ${brand} in these US cities.`
  return [
    `${brand} fits best in ${list(names('strong'))}.`,
    names('weak').length ? `Weakest in ${list(names('weak'))}.` : '',
    names('none').length ? `No local data for ${list(names('none'))}.` : '',
  ].filter(Boolean).join(' ')
}
