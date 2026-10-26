'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Topbar } from '../../../components/app/Shell.js'
import { SAMPLES } from '../../../lib/samples.js'
import { counts } from '../../../lib/workspace.js'
const firstDrop = (ex) => ex.turns.flatMap((t) => t.replies).find((r) => r.type === 'drop')?.drop

export default function Explore() {
  const [shops, setShops] = useState([])
  useEffect(() => {
    Promise.all(SAMPLES.map((id) => fetch(`/examples/${id}.json`).then((r) => r.json()).then((ex) => ({ id, ex, drop: firstDrop(ex) })))).then(setShops).catch(() => setShops([]))
  }, [])
  const stockCount = {}
  const skipCount = {}
  for (const s of shops) for (const r of s.drop.sheet.rows) {
    if (r.group === 'stock') stockCount[r.name] = (stockCount[r.name] || 0) + 1
    if (r.group === 'skip') skipCount[r.name] = (skipCount[r.name] || 0) + 1
  }
  const splits = Object.keys(stockCount).filter((n) => skipCount[n]).slice(0, 5)
  return (
    <>
      <Topbar crumbs={[{ label: 'Sample shops' }]} />
      <div className="page">
        <div className="page-head"><div><h1>Sample shops</h1><p>One supplier list, sorted for {SAMPLES.length} different crowds. Real Restocked output from Qloo, recorded for sample shops.</p></div></div>
        <div className="ov-grid">
          <div className="table-wrap">
            <table className="table" style={{ minWidth: 620 }}>
              <thead><tr><th>Shop</th><th>Crowd loves</th><th>Top stock picks</th><th>Mix</th></tr></thead>
              <tbody>
                {shops.map(({ id, ex, drop }) => {
                  const c = counts(drop)
                  return (
                    <tr key={id} className="row">
                      <td><Link href={`/app/explore/${id}`} style={{ textDecoration: 'none' }}><div className="brand-cell"><span className="logo-sq">{drop.city.slice(0, 2)}</span><div><div>{ex.label.split(',')[0]}</div><div className="faint" style={{ fontSize: 12, fontWeight: 400 }}>{drop.city}</div></div></div></Link></td>
                      <td className="mute" style={{ fontSize: 13 }}>{drop.loves.join(', ')}</td>
                      <td style={{ fontSize: 13 }}>{drop.sheet.rows.filter((r) => r.group === 'stock').slice(0, 3).map((r) => r.name).join(', ')}</td>
                      <td><span className="mono faint" style={{ fontSize: 12 }}><span style={{ color: 'var(--stock)' }}>{c.stock}</span> · {c.consider} · <span style={{ color: 'var(--skip)' }}>{c.skip}</span></span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="card-h"><h2>Splits the room</h2></div>
            <div className="card-b">
              <p className="mute" style={{ margin: '0 0 12px' }}>Stock for one crowd, skip for another. A bestseller list can&apos;t see this.</p>
              <ul className="list" style={{ margin: '0 -16px -16px' }}>
                {splits.map((n) => <li key={n}><Link className="rowlink" href={`/app/map?brand=${encodeURIComponent(n)}`}><span className="grow"><b>{n}</b><small>Stock in {stockCount[n]}, skip in {skipCount[n]}</small></span><span className="btn sm">Map</span></Link></li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
