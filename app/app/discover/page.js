'use client'

import Link from 'next/link'
import { useState } from 'react'
import Icon from '../../../components/app/Icon.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'

export default function Discover() {
  const { ws, busy, ask, update, setToast } = useWorkspace()
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const loves = ws.shop?.loves || []

  async function run() {
    setError('')
    const r = await ask(loves.length ? `Find me brands like ${loves.join(', ')}` : 'Find me new brands for my crowd')
    const s = r?.replies?.find((x) => x.type === 'similar')
    if (s) setFound(s.similar)
    else setError(r?.replies?.find((x) => x.type === 'text')?.text || r?.error || 'Nothing came back.')
  }
  const add = (name) => {
    update((w) => ({ basket: [...new Set([...w.basket, name])] }))
    setToast(`${name} added to your next drop`)
  }

  return (
    <>
      <Topbar crumbs={[{ label: 'Discover brands' }]} />
      <div className="page">
        <div className="page-head">
          <div><h1>Discover brands</h1><p>Brands that fans of what your customers love also love. The most famous names are left out; you know them already.</p></div>
          <div className="acts">
            {ws.basket.length > 0 && <Link href="/app/new" className="btn">Next drop · {ws.basket.length}</Link>}
            <button className="btn primary" disabled={busy || (!loves.length && !ws.agent.state?.loves?.length)} onClick={run}><Icon name="discover" size={14} /> {found ? 'Run again' : 'Find brands'}</button>
          </div>
        </div>
        <div className="meta" style={{ marginBottom: 16 }}>
          {loves.length ? <span>Based on fans of <b>{loves.join(', ')}</b></span> : <span>Set what your customers love in <Link href="/app/settings">Settings</Link> first</span>}
        </div>
        {busy && <div className="card empty"><span className="spinner" style={{ margin: '0 auto', width: 22, height: 22 }} /><h2>Asking Qloo</h2></div>}
        {!busy && error && <div className="card empty"><p>{error}</p></div>}
        {!busy && found && (
          <div className="cards">
            {found.brands.map((b) => {
              const inBasket = ws.basket.includes(b.name)
              return (
                <div key={b.id} className="card bcard">
                  <h3><span className="logo-sq">{b.name.slice(0, 2)}</span>{b.name}</h3>
                  <p>{b.about || 'No description from Qloo.'}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`btn sm${inBasket ? '' : ' primary'}`} disabled={inBasket} onClick={() => add(b.name)}>{inBasket ? 'Added' : 'Add to next drop'}</button>
                    <Link className="btn sm" href={`/app/map?brand=${encodeURIComponent(b.name)}`}>Map</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {!busy && !found && !error && <div className="card empty"><div className="empty-ic"><Icon name="discover" size={20} /></div><h2>New brands for your crowd</h2><p>Restocked asks Qloo what else fans of your customers&apos; favourites love, then you add the ones you like to your next drop.</p></div>}
      </div>
    </>
  )
}
