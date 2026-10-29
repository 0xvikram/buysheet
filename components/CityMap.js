'use client'

import { useMemo } from 'react'
import { FITS } from '../lib/cities.js'

// A dotted map of the lower 48, drawn from a rough outline: no map library, no tiles, no key.
// [lon, lat], clockwise from the north-west corner.
const OUTLINE = [
  [-124.7, 48.4], [-123, 49], [-95.2, 49], [-94.8, 49.4], [-89.5, 48], [-84.6, 46.4], [-82.4, 43], [-79, 43.3],
  [-76.8, 43.6], [-74.8, 45], [-71.5, 45], [-69.2, 47.4], [-67.8, 47.1], [-67, 44.8], [-70.2, 43.6], [-71, 42.3],
  [-70, 41.8], [-71.9, 41.3], [-73.9, 40.6], [-74, 39.6], [-74.9, 38.9], [-76, 37], [-75.5, 35.3], [-77.9, 33.9],
  [-79.2, 33.2], [-80.9, 32], [-81.4, 30.7], [-80.6, 28.4], [-80, 26.7], [-80.4, 25.2], [-81.1, 25.1], [-81.8, 26.1],
  [-82.6, 27.8], [-82.8, 29.2], [-84, 30], [-85.4, 29.7], [-86.5, 30.4], [-88, 30.4], [-89.4, 30], [-89.2, 29.2],
  [-90.5, 29.1], [-92, 29.6], [-93.8, 29.7], [-94.8, 29.3], [-96.8, 28.2], [-97.4, 27.3], [-97.2, 25.9], [-99.1, 26.4],
  [-99.5, 27.5], [-101.4, 29.8], [-102.4, 29.8], [-103.1, 29], [-104.5, 29.6], [-106.5, 31.8], [-108.2, 31.8],
  [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.4, 33.7], [-120.6, 34.6], [-121.9, 36.6],
  [-122.5, 37.8], [-123.8, 39.5], [-124.4, 40.4], [-124.2, 42], [-124, 44.6], [-124, 46.3],
]

const W = 640
const H = 380
const PAD = 18
const LON = [-125, -66.5]
const LAT = [24.3, 49.6]
const K = Math.cos((37 * Math.PI) / 180) // squash longitude so the country keeps its shape
const sx = (W - PAD * 2) / ((LON[1] - LON[0]) * K)
const sy = (H - PAD * 2) / (LAT[1] - LAT[0])
const S = Math.min(sx, sy)
const project = (lon, lat) => [PAD + (lon - LON[0]) * K * S, PAD + (LAT[1] - lat) * S]

function inside([x, y], poly) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

const STEP = 9
const DOTS = (() => {
  const poly = OUTLINE.map(([lon, lat]) => project(lon, lat))
  const out = []
  for (let y = PAD; y < H - PAD; y += STEP) for (let x = PAD; x < W - PAD; x += STEP) if (inside([x, y], poly)) out.push([x, y])
  return out
})()

const SIZE = { strong: 15, fair: 10, weak: 7, none: 6 }
const BELOW = new Set(['Portland', 'Los Angeles', 'Atlanta']) // labels that would collide above a neighbour

/** map: { brand: { name }, rows: [{ name, lat, lon, fit, rank }] }. `focus` and `onFocus` link it to a list. */
export default function CityMap({ map, compact = false, focus = null, onFocus = () => {} }) {
  const placed = useMemo(() => map.rows.map((r) => ({ ...r, xy: project(r.lon, r.lat) })), [map.rows])
  return (
    <figure className="citymap" aria-label={`Where ${map.brand.name} fits across US cities`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden={compact ? true : undefined}>
        <g className="land">
          {DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.6} />)}
        </g>
        {placed.map((r, i) => (
          <g
            key={r.name}
            className={`city ${r.fit}${focus === r.name ? ' on' : ''}`}
            transform={`translate(${r.xy[0]} ${r.xy[1]})`}
            style={{ animationDelay: `${i * 60}ms` }}
            tabIndex={compact ? -1 : 0}
            aria-label={`${r.name}: ${FITS[r.fit]}${r.rank ? `, number ${r.rank}` : ''}`}
            onMouseEnter={() => onFocus(r.name)}
            onFocus={() => onFocus(r.name)}
            onClick={() => onFocus(r.name)}
          >
            {r.fit === 'strong' && <circle className="pulse" r={SIZE.strong} />}
            <circle className="dot-c" r={SIZE[r.fit]} />
            {!compact && r.rank && r.rank <= 3 && <text className="rank-t" dy="4">{r.rank}</text>}
            {!compact && <text className="label" y={BELOW.has(r.name) ? SIZE[r.fit] + 17 : -SIZE[r.fit] - 7}>{r.name}</text>}
          </g>
        ))}
      </svg>
    </figure>
  )
}
