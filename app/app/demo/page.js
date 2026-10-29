'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'
import { loadSample } from '../../../components/app/actions.js'

// One click from the landing page to a real drop: loads the sample shop if this browser has no
// workspace yet (never overwrites one) and opens its first drop.
export default function Demo() {
  const { ws, ready, replace } = useWorkspace()
  const router = useRouter()
  useEffect(() => {
    if (!ready) return
    if (ws.drops.length) {
      router.replace(`/app/drops/${ws.drops.find((d) => !d.drop.whatIf)?.number ?? ws.drops[0].number}`)
      return
    }
    loadSample().then((sample) => {
      replace(sample)
      router.replace(`/app/drops/${sample.drops[0].number}`)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])
  return (
    <>
      <Topbar crumbs={[{ label: 'Live demo' }]} />
      <div className="page narrow"><div className="card empty"><span className="spinner" style={{ margin: '0 auto', width: 22, height: 22 }} /><h2>Opening a real drop…</h2><p>A Denver gift shop, sorted by Restocked from live Qloo data.</p></div></div>
    </>
  )
}
