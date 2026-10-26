'use client'

import Link from 'next/link'
import { useState } from 'react'
import ConfirmButton from '../../components/app/ConfirmButton.js'
import Icon from '../../components/app/Icon.js'
import CountUp from '../../components/motion/CountUp.js'
import { Topbar } from '../../components/app/Shell.js'
import { useWorkspace } from '../../components/app/Workspace.js'
import { loadSample } from '../../components/app/actions.js'
import { counts, overview } from '../../lib/workspace.js'

const pad = (n) => String(n).padStart(2, '0')
const when = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

function Mix({ drop }) {
  const c = counts(drop)
  const total = c.stock + c.consider + c.skip || 1
  return <span className="mix" aria-hidden="true"><i className="s" style={{ width: `${(c.stock / total) * 100}%` }} /><i className="c" style={{ width: `${(c.consider / total) * 100}%` }} /><i className="k" style={{ width: `${(c.skip / total) * 100}%` }} /></span>
}

function Welcome() {
  const { replace } = useWorkspace()
  const [loading, setLoading] = useState(false)
  return (
    <div className="page narrow">
      <div className="card empty" style={{ marginTop: 24 }}>
        <div className="empty-ic"><Icon name="store" size={20} /></div>
        <h2>Welcome to your buying workspace</h2>
        <p>Set up your shop once: where it is and what your customers already love. Then paste any supplier&apos;s brand list and get it sorted into stock, consider and skip.</p>
        <div className="acts">
          <Link href="/app/new" className="btn primary">Set up my shop</Link>
          <button className="btn" disabled={loading} onClick={async () => { setLoading(true); replace(await loadSample()) }}>{loading ? 'Loading…' : 'Explore with a sample shop'}</button>
        </div>
      </div>
      <div className="grid-3" style={{ marginTop: 16 }}>
        {[['agent', 'An agent, not a form', 'Ask why, what-if, compare and discover. Every answer shows the Qloo data behind it.'], ['map', '12-city market map', 'See where any brand is strongest across the US before you pitch or open.'], ['connect', 'Works in your AI', 'Use the same tools from Claude or ChatGPT through MCP.']].map(([i, h, p]) => (
          <div key={h} className="card feature"><div className="ic"><Icon name={i} /></div><h3>{h}</h3><p>{p}</p></div>
        ))}
      </div>
    </div>
  )
}

export default function Overview() {
  const { ws, ready, replace } = useWorkspace()
  if (!ready) return <><Topbar crumbs={[{ label: 'Overview' }]} /><div className="page" /></>
  if (!ws.shop && !ws.drops.length) return <><Topbar crumbs={[{ label: 'Overview' }]} /><Welcome /></>
  const o = overview(ws)
  const recent = [...ws.drops].reverse().slice(0, 6)
  return (
    <>
      <Topbar crumbs={[{ label: 'Overview' }]} />
      <div className="page">
        {ws.sample && (
          <div className="banner">
            <p><b>You&apos;re exploring a sample shop.</b> Every drop here is real Restocked output from Qloo, recorded for “{ws.sample}”.</p>
            <ConfirmButton onConfirm={() => replace({ ...ws, shop: null, drops: [], agent: { messages: [], state: {}, chips: [] }, maps: [], basket: [], sample: null })}>Clear sample</ConfirmButton>
            <Link href="/app/new" className="btn brand sm">Set up my shop</Link>
          </div>
        )}
        <div className="page-head">
          <div>
            <h1>Good to see you{ws.shop ? `, ${ws.shop.name}` : ''}</h1>
            <p>{ws.shop ? `${ws.shop.city} · customers love ${ws.shop.loves?.join(', ') || 'not set yet'}` : 'Your buying at a glance.'}</p>
          </div>
          <div className="acts"><Link href="/app/map" className="btn">Map a brand</Link><Link href="/app/new" className="btn primary"><Icon name="plus" size={14} /> New drop</Link></div>
        </div>
        <div className="kpis">
          <div className="card kpi"><small>Drops</small><b><CountUp value={o.drops} /></b><span>{o.brands} brands sorted</span></div>
          <div className="card kpi"><small>Reviewed by you</small><b>{o.reviewed}<span style={{ fontSize: 14, color: 'var(--faint)' }}> / {o.brands}</span></b><span>Brands you made the call on</span></div>
          <div className="card kpi"><small>Agreement with agent</small><b>{o.agreement === null ? '—' : `${o.agreement}%`}</b><span>{o.agreement === null ? 'Review a drop to see it' : 'Of the calls you made'}</span></div>
          <div className="card kpi"><small>Bestseller flips</small><b><CountUp value={o.flips} /></b><span>Where your crowd differs</span></div>
        </div>
        <div className="ov-grid">
          <div className="card">
            <div className="card-h"><h2>Recent drops</h2><Link href="/app/drops" className="right btn ghost sm">View all</Link></div>
            <ul className="list">
              {recent.length ? recent.map((d) => {
                const c = counts(d.drop)
                return (
                  <li key={d.number}>
                    <Link href={`/app/drops/${d.number}`} className="rowlink">
                      <span className="logo-sq">#{pad(d.number)}</span>
                      <span className="grow"><b>{d.name}</b><small>{d.drop.title}</small></span>
                      <Mix drop={d.drop} />
                      <span className="faint mono hide-sm" style={{ fontSize: 12, width: 90, textAlign: 'right' }}>{c.stock}·{c.consider}·{c.skip}</span>
                      <span className="faint hide-sm" style={{ fontSize: 12, width: 54, textAlign: 'right' }}>{when(d.createdAt)}</span>
                    </Link>
                  </li>
                )
              }) : <li><div className="rowlink mute">No drops yet. <Link href="/app/new">Make your first one</Link>.</div></li>}
            </ul>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="card">
              <div className="card-h"><h2>Quick actions</h2></div>
              <div className="quick">
                <Link href="/app/new"><b>New drop</b><span>Paste a supplier list</span></Link>
                <Link href="/app/drops/latest?tab=review"><b>Review</b><span>Make your calls fast</span></Link>
                <Link href="/app/discover"><b>Discover</b><span>Brands your crowd loves</span></Link>
                <Link href="/app/agent"><b>Ask the agent</b><span>Why, what-if, compare</span></Link>
              </div>
            </div>
            {ws.maps.length > 0 && (
              <div className="card">
                <div className="card-h"><h2>Recent maps</h2></div>
                <ul className="list">
                  {ws.maps.slice(0, 4).map((m) => (
                    <li key={m.brand.id}><Link className="rowlink" href={`/app/map?brand=${encodeURIComponent(m.brand.name)}`}><Icon name="map" /><span className="grow"><b>{m.brand.name}</b><small>Best in {m.rows.filter((r) => r.fit === 'strong').slice(0, 3).map((r) => r.name).join(', ')}</small></span></Link></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
