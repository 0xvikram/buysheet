'use client'

import { useState } from 'react'
import { FITS } from '../../lib/cities.js'
import CityMap from '../CityMap.js'

const BADGE = { strong: 'stock', fair: 'consider', weak: 'skip', none: 'nosignal' }

/** One brand's city map with its ranking beside it. */
export default function MapView({ map }) {
  const [focus, setFocus] = useState(null)
  return (
    <div className="map-layout">
      <div className="card">
        <div className="card-h">
          <h2>{map.brand.name}</h2>
          <div className="right legend">
            <span><i className="dot stock" />Strong</span><span><i className="dot consider" />Fair</span><span><i className="dot skip" />Weak</span><span><i className="none-k" />No data</span>
          </div>
        </div>
        <div className="card-b">
          <p className="mute" style={{ margin: '0 0 8px' }}>{map.text}</p>
          <CityMap map={map} focus={focus} onFocus={setFocus} />
        </div>
      </div>
      <div className="card">
        <div className="card-h"><h3>Ranking</h3><span className="right faint" style={{ fontSize: 12 }}>12 US cities</span></div>
        <ol className="ranking">
          {map.rows.map((r) => (
            <li key={r.name} className={focus === r.name ? 'on' : ''} onMouseEnter={() => setFocus(r.name)}>
              <span className="r">{r.rank ? `#${r.rank}` : '–'}</span>{r.name}
              <span className={`badge ${BADGE[r.fit]}`}>{FITS[r.fit].replace(' fit', '')}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
