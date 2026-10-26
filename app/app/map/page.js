'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Icon from '../../../components/app/Icon.js'
import MapView from '../../../components/app/MapView.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'

const PICKS = ['Filson', 'Le Labo', 'Baggu', 'Stanley', 'Glossier', 'Topo Designs']

function MarketMap() {
  const { ws, ready, busy, ask } = useWorkspace()
  const params = useSearchParams()
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(null)
  const asked = useRef(false)
  const wanted = params.get('brand')

  const find = (name) => ws.maps.find((m) => m.brand.name.toLowerCase().startsWith(name.toLowerCase()))
  async function run(name) {
    const brand = name.trim()
    if (!brand || busy) return
    setQ('')
    const hit = find(brand)
    if (hit) { setShown(hit.brand.id); return }
    const r = await ask(`Where does ${brand} fit?`)
    const m = r?.replies?.find((x) => x.type === 'map')
    if (m) setShown(m.map.brand.id)
  }

  useEffect(() => {
    if (!ready || asked.current) return
    asked.current = true
    if (wanted) run(wanted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const map = ws.maps.find((m) => m.brand.id === shown) || ws.maps[0]
  const fromDrops = [...new Set(ws.drops.flatMap((d) => d.drop.sheet.rows.filter((r) => r.group === 'stock').map((r) => r.name)))].slice(0, 4)
  const picks = [...new Set([...fromDrops, ...PICKS])].slice(0, 8)

  return (
    <>
      <Topbar crumbs={[{ label: 'Market map' }]} />
      <div className="page">
        <div className="page-head"><div><h1>Market map</h1><p>Where a brand is strongest across 12 US cities, from Qloo&apos;s local readings. Use it before you pitch, open or reorder.</p></div></div>
        <form className="card" style={{ padding: 14, marginBottom: 16 }} onSubmit={(e) => { e.preventDefault(); run(q) }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <label htmlFor="map-q" className="sr-only">Brand</label>
            <input id="map-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type any brand, e.g. Filson" autoComplete="off" />
            <button className="btn primary" disabled={busy || !q.trim()}><Icon name="map" size={14} /> Map it</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {picks.map((p) => <button type="button" key={p} className="chip" disabled={busy} onClick={() => run(p)}>{p}</button>)}
          </div>
        </form>
        {busy ? (
          <div className="card empty"><span className="spinner" style={{ margin: '0 auto', width: 22, height: 22 }} /><h2>Reading 12 cities on Qloo</h2><p>One city at a time, so the rankings are comparable. About 10 seconds.</p></div>
        ) : map ? (
          <>
            {ws.maps.length > 1 && (
              <div className="seg" role="group" aria-label="Recent maps" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                {ws.maps.map((m) => <button key={m.brand.id} aria-pressed={m.brand.id === map.brand.id} onClick={() => setShown(m.brand.id)}>{m.brand.name}</button>)}
              </div>
            )}
            <MapView map={map} />
          </>
        ) : ready && (
          <div className="card empty"><div className="empty-ic"><Icon name="map" size={20} /></div><h2>Map your first brand</h2><p>Pick one above or type any brand name.</p></div>
        )}
      </div>
    </>
  )
}

export default function Page() {
  return <Suspense fallback={null}><MarketMap /></Suspense>
}
