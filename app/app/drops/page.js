'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '../../../components/app/Icon.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'
import { counts } from '../../../lib/workspace.js'

const pad = (n) => String(n).padStart(2, '0')

export default function Drops() {
  const { ws, ready } = useWorkspace()
  const router = useRouter()
  const drops = [...ws.drops].reverse()
  return (
    <>
      <Topbar crumbs={[{ label: 'Drops' }]} />
      <div className="page">
        <div className="page-head"><div><h1>Drops</h1><p>Every supplier list you&apos;ve sorted, newest first.</p></div><div className="acts"><Link href="/app/new" className="btn primary"><Icon name="plus" size={14} /> New drop</Link></div></div>
        {ready && !drops.length ? (
          <div className="card empty"><div className="empty-ic"><Icon name="drops" size={20} /></div><h2>No drops yet</h2><p>Paste a supplier&apos;s brand list and the agent sorts it for your crowd.</p><div className="acts"><Link href="/app/new" className="btn primary">New drop</Link></div></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>#</th><th>Drop</th><th>Shop &amp; crowd</th><th>Stock</th><th>Consider</th><th>Skip</th><th>Reviewed</th><th>Created</th></tr></thead>
              <tbody>
                {drops.map((d) => {
                  const c = counts(d.drop)
                  const total = c.stock + c.consider + c.skip
                  const reviewed = Object.keys(d.calls || {}).length
                  return (
                    <tr key={d.number} className="row" onClick={() => router.push(`/app/drops/${d.number}`)}>
                      <td className="mono faint">#{pad(d.number)}</td>
                      <td><Link href={`/app/drops/${d.number}`} style={{ textDecoration: 'none', fontWeight: 500 }}>{d.name}</Link>{d.drop.whatIf && <span className="badge plain" style={{ marginLeft: 8 }}>What-if</span>}{d.supplier && <div className="faint" style={{ fontSize: 12 }}>{d.supplier}</div>}</td>
                      <td className="mute" style={{ maxWidth: 320 }}>{d.drop.title}</td>
                      <td><span className="badge stock">{c.stock}</span></td>
                      <td><span className="badge consider">{c.consider}</span></td>
                      <td><span className="badge skip">{c.skip}</span></td>
                      <td><div className="rank"><div className="bar"><i style={{ width: `${total ? (reviewed / total) * 100 : 0}%` }} /></div>{reviewed}/{total}</div></td>
                      <td className="faint nowrap">{new Date(d.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
