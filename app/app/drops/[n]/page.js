'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import AgentThread from '../../../../components/app/AgentThread.js'
import DropTable from '../../../../components/app/DropTable.js'
import Icon from '../../../../components/app/Icon.js'
import MapView from '../../../../components/app/MapView.js'
import Review from '../../../../components/app/Review.js'
import CountUp from '../../../../components/motion/CountUp.js'
import { Topbar } from '../../../../components/app/Shell.js'
import { useWorkspace } from '../../../../components/app/Workspace.js'
import { downloadCsv, shareDrop } from '../../../../components/app/actions.js'
import { counts } from '../../../../lib/workspace.js'

const pad = (n) => String(n).padStart(2, '0')
const TABS = [['table', 'Table', 'table'], ['review', 'Review', 'cards'], ['map', 'Map', 'map'], ['work', 'Qloo calls', 'list']]

function DropPage() {
  const { ws, ready, busy, ask, update, setToast } = useWorkspace()
  const params = useParams()
  const search = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(search.get('tab') || 'table')
  const [mapBrand, setMapBrand] = useState('')

  const record = params.n === 'latest'
    ? [...ws.drops].reverse().find((d) => !d.drop.whatIf) || ws.drops.at(-1)
    : ws.drops.find((d) => String(d.number) === params.n)

  useEffect(() => {
    if (params.n === 'latest' && record) router.replace(`/app/drops/${record.number}?tab=${tab}`)
  }, [params.n, record, router, tab])

  if (!ready) return <><Topbar crumbs={[{ label: 'Drops', href: '/app/drops' }]} /><div className="page" /></>
  if (!record) {
    return (
      <>
        <Topbar crumbs={[{ label: 'Drops', href: '/app/drops' }, { label: 'Not found' }]} />
        <div className="page narrow"><div className="card empty"><h2>That drop isn&apos;t in this workspace</h2><p>Drops are saved in the browser they were made in.</p><div className="acts"><Link className="btn primary" href="/app/new">New drop</Link><Link className="btn" href="/app/drops">All drops</Link></div></div></div>
      </>
    )
  }

  const { drop } = record
  const c = counts(drop)
  const calls = record.calls || {}
  const setCall = (id, group) => update((w) => ({
    drops: w.drops.map((d) => {
      if (d.number !== record.number) return d
      const next = { ...d.calls }
      if (group) next[id] = group
      else delete next[id]
      return { ...d, calls: next }
    }),
  }))
  const stockNames = drop.sheet.rows.filter((r) => r.group === 'stock').map((r) => r.name)
  const picked = mapBrand || stockNames[0] || drop.sheet.rows[0]?.name
  const map = ws.maps.find((m) => m.brand.name.toLowerCase() === (picked || '').toLowerCase() || drop.sheet.rows.find((r) => r.name === picked)?.id === m.brand.id)
  const reviewed = Object.keys(calls).length
  const total = c.stock + c.consider + c.skip
  const flips = drop.baseline?.flips?.length ?? 0

  return (
    <>
      <Topbar
        crumbs={[{ label: 'Drops', href: '/app/drops' }, { label: `#${pad(record.number)} · ${record.name}` }]}
        actions={<button className="btn sm hide-sm" onClick={() => shareDrop(record, setToast)}><Icon name="share" size={14} /> Share</button>}
      />
      <div className="with-panel">
        <div className="page">
          <div className="page-head">
            <div style={{ minWidth: 0 }}>
              <h1>{record.name}{record.supplier ? <span className="faint" style={{ fontWeight: 400 }}> · {record.supplier}</span> : null}</h1>
              <div className="meta">
                {drop.city && <span><Icon name="map" size={12} /> <b>{drop.city}</b></span>}
                {drop.loves?.length > 0 && <span>Customers love <b>{drop.loves.join(', ')}</b></span>}
                <span><b>{drop.sheet.rows.length}</b> brands</span>
                {drop.whatIf && <span className="badge plain">What-if</span>}
                <span>{new Date(record.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {record.trace?.length || 0} Qloo calls</span>
              </div>
            </div>
            <div className="acts">
              <button className="btn" onClick={() => downloadCsv(record)}><Icon name="download" size={14} /> Export CSV</button>
              <button className="btn primary" onClick={() => setTab('review')}>Review {total - reviewed > 0 ? total - reviewed : ''}</button>
            </div>
          </div>
          <div className="kpis">
            <div className="card kpi"><small><i className="dot stock" />Stock</small><b><CountUp value={c.stock} duration={0.9} /></b><span>Strong taste and local fit</span></div>
            <div className="card kpi"><small><i className="dot consider" />Consider</small><b><CountUp value={c.consider} duration={0.9} /></b><span>Mixed signals</span></div>
            <div className="card kpi"><small><i className="dot skip" />Skip</small><b><CountUp value={c.skip} duration={0.9} /></b><span>Weak fit for this crowd</span></div>
            <div className="card kpi"><small>vs a bestseller list</small><b>{flips} flip{flips === 1 ? '' : 's'}</b><span>{flips ? drop.baseline.flips.slice(0, 3).map((f) => f.name).join(', ') : 'Your crowd is close to average'}</span></div>
          </div>
          <div className="tabs" role="tablist">
            {TABS.map(([id, label, icon]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                <Icon name={icon} size={14} />{label}
                {id === 'review' && <span className="n">{reviewed}/{total}</span>}
                {id === 'work' && <span className="n">{record.trace?.length || 0}</span>}
              </button>
            ))}
          </div>
          <div className="tab-body">
            {tab === 'table' && <DropTable drop={drop} calls={calls} onCall={setCall} openName={search.get('brand')} />}
            {tab === 'review' && <Review rows={drop.sheet.rows} calls={calls} onCall={setCall} onDone={<><button className="btn primary" onClick={() => downloadCsv(record)}><Icon name="download" size={14} /> Export my order</button><button className="btn" onClick={() => setTab('table')}>See the table</button></>} />}
            {tab === 'map' && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                  <span className="mute" style={{ fontSize: 13 }}>Map a brand from this drop:</span>
                  <select className="select" style={{ width: 'auto' }} value={picked} onChange={(e) => setMapBrand(e.target.value)} aria-label="Brand to map">
                    {drop.sheet.rows.map((r) => <option key={r.id}>{r.name}</option>)}
                  </select>
                  {!map && <button className="btn primary sm" disabled={busy} onClick={() => ask(`Where does ${picked} fit?`)}>{busy ? 'Reading 12 cities…' : 'Map it'}</button>}
                </div>
                {map ? <MapView map={map} /> : <div className="card empty"><div className="empty-ic"><Icon name="map" size={20} /></div><h2>Where does {picked} fit?</h2><p>Reads {picked}&apos;s local standing in 12 US cities on Qloo, one at a time. Takes about 10 seconds.</p></div>}
              </>
            )}
            {tab === 'work' && (
              <div className="card">
                <div className="card-h"><h2>Every Qloo call behind this drop</h2><span className="right faint" style={{ fontSize: 12 }}>Nothing is guessed</span></div>
                <ol className="work">
                  {(record.trace || []).map((t, i) => (
                    <li key={i}>
                      <span className="st">✓</span>
                      <div><b style={{ fontWeight: 500 }}>{t.label}</b><code>GET {t.path}?{Object.entries(t.params).map(([k, v]) => `${k}=${String(v).replace(/[0-9A-F]{8}-[0-9A-F-]{27}/gi, (id) => `${id.slice(0, 8)}…`)}`).join('&')}</code></div>
                      <span className="t">{t.status} · {t.results ?? 0} · {t.cached ? 'cached' : `${t.ms}ms`}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
        <AgentThread stateFor={(s) => ({ ...s, drop })} />
      </div>
    </>
  )
}

export default function Page() {
  return <Suspense fallback={null}><DropPage /></Suspense>
}
