'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import DropTable from '../../../../components/app/DropTable.js'
import { Topbar } from '../../../../components/app/Shell.js'
import { counts } from '../../../../lib/workspace.js'
import { SAMPLES } from '../../../../lib/samples.js'

export default function SampleShop() {
  const { id } = useParams()
  const [ex, setEx] = useState(null)
  useEffect(() => {
    if (SAMPLES.includes(id)) fetch(`/examples/${id}.json`).then((r) => r.json()).then(setEx).catch(() => setEx(null))
  }, [id])
  const drop = ex?.turns.flatMap((t) => t.replies).find((r) => r.type === 'drop')?.drop
  const c = drop ? counts(drop) : null
  return (
    <>
      <Topbar crumbs={[{ label: 'Sample shops', href: '/app/explore' }, { label: ex?.label || '…' }]} />
      <div className="page">
        {drop && (
          <>
            <div className="page-head"><div><h1>{ex.label}</h1><div className="meta"><span><b>{drop.city}</b></span><span>Customers love <b>{drop.loves.join(', ')}</b></span><span className="badge plain">Sample shop · recorded {ex.recordedOn}</span></div></div></div>
            <div className="kpis">
              <div className="card kpi"><small><i className="dot stock" />Stock</small><b>{c.stock}</b></div>
              <div className="card kpi"><small><i className="dot consider" />Consider</small><b>{c.consider}</b></div>
              <div className="card kpi"><small><i className="dot skip" />Skip</small><b>{c.skip}</b></div>
              <div className="card kpi"><small>vs a bestseller list</small><b>{drop.baseline?.flips?.length ?? 0} flips</b></div>
            </div>
            <DropTable drop={drop} />
          </>
        )}
      </div>
    </>
  )
}
