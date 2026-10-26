'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ConfirmButton from '../../../components/app/ConfirmButton.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'
import ThemeToggle from '../../../components/ThemeToggle.js'
import { EMPTY_WORKSPACE, SHOP_KINDS } from '../../../lib/workspace.js'

export default function Settings() {
  const { ws, ready, update, replace, setToast } = useWorkspace()
  const [shop, setShop] = useState({ name: '', city: '', kind: SHOP_KINDS[0], loves: '' })
  useEffect(() => {
    if (ready && ws.shop) setShop({ ...ws.shop, loves: (ws.shop.loves || []).join(', ') })
  }, [ready, ws.shop])

  function save(e) {
    e.preventDefault()
    update(() => ({ shop: { name: shop.name.trim(), city: shop.city.trim(), kind: shop.kind, loves: shop.loves.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5) } }))
    setToast('Shop saved')
  }

  return (
    <>
      <Topbar crumbs={[{ label: 'Settings' }]} />
      <div className="page narrow">
        <div className="page-head"><div><h1>Settings</h1><p>Your shop profile, appearance and data.</p></div></div>
        <form className="card" style={{ marginBottom: 16 }} onSubmit={save}>
          <div className="card-h"><h2>Shop profile</h2></div>
          <div className="card-b form-grid">
            <div className="form-grid two">
              <div className="field"><label htmlFor="s-name">Shop name</label><input id="s-name" className="input" required value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} /></div>
              <div className="field"><label htmlFor="s-kind">Type of shop</label><select id="s-kind" className="select" value={shop.kind} onChange={(e) => setShop({ ...shop, kind: e.target.value })}>{SHOP_KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
            </div>
            <div className="field"><label htmlFor="s-city">City</label><input id="s-city" className="input" required value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })} /></div>
            <div className="field"><label htmlFor="s-loves">Customers love</label><input id="s-loves" className="input" value={shop.loves} onChange={(e) => setShop({ ...shop, loves: e.target.value })} /><small>Up to 5, separated by commas. Used for new drops and Discover.</small></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn primary">Save</button></div>
          </div>
        </form>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h2>Appearance</h2></div>
          <div className="card-b" style={{ display: 'flex', alignItems: 'center', gap: 12 }}><ThemeToggle className="btn" /><span className="mute">Switch between light and dark. Remembered in this browser.</span></div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h2>Plan</h2><span className="right"><Link href="/pricing" className="btn sm">See plans</Link></span></div>
          <div className="card-b mute">Free while Restocked is in beta. Paid plans start when accounts launch.</div>
        </div>
        <div className="card">
          <div className="card-h"><h2>Data</h2></div>
          <div className="card-b" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="mute" style={{ flex: 1, minWidth: 240 }}>Your shop, {ws.drops.length} drop{ws.drops.length === 1 ? '' : 's'} and the agent conversation are stored in this browser only. Nothing about your shop is shared.</span>
            <ConfirmButton className="btn" onConfirm={() => { replace(EMPTY_WORKSPACE); setToast('Workspace cleared') }}>Clear workspace</ConfirmButton>
          </div>
        </div>
      </div>
    </>
  )
}
