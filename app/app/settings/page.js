'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ConfirmButton from '../../../components/app/ConfirmButton.js'
import Select from '../../../components/app/Select.js'
import CityPicker from '../../../components/app/CityPicker.js'
import LovesPicker from '../../../components/app/LovesPicker.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'
import ThemeToggle from '../../../components/ThemeToggle.js'
import { EMPTY_WORKSPACE, SHOP_KINDS } from '../../../lib/workspace.js'

export default function Settings() {
  const { ws, ready, update, replace, setToast } = useWorkspace()
  const [shop, setShop] = useState({ name: '', city: '', kind: SHOP_KINDS[0], loves: [] })
  const [cityStatus, setCityStatus] = useState('idle')
  useEffect(() => {
    if (ready && ws.shop) setShop({ ...ws.shop, loves: ws.shop.loves || [] })
  }, [ready, ws.shop])

  function save(e) {
    e.preventDefault()
    update(() => ({ shop: { name: shop.name.trim(), city: shop.city.trim(), kind: shop.kind, loves: shop.loves.slice(0, 5) } }))
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
              <div className="field"><label htmlFor="s-kind">Type of shop</label><Select id="s-kind" label="Type of shop" value={shop.kind} options={SHOP_KINDS} onChange={(k) => setShop({ ...shop, kind: k })} /></div>
            </div>
            <div className="field"><label htmlFor="s-city">City</label><CityPicker id="s-city" value={shop.city} onChange={(city) => setShop((x) => ({ ...x, city }))} onStatus={setCityStatus} /></div>
            <div className="field"><label htmlFor="s-loves">Customers love</label><LovesPicker id="s-loves" values={shop.loves} onChange={(loves) => setShop((x) => ({ ...x, loves }))} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn primary" disabled={cityStatus === 'no' || cityStatus === 'checking'}>Save</button></div>
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
