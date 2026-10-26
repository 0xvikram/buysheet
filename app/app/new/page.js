'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Icon from '../../../components/app/Icon.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'
import { SHOP_KINDS, setupMessage } from '../../../lib/workspace.js'

const SAMPLE_LIST = 'Baggu\nLe Labo\nBoy Smells\nOtherland\nAesop\nMoleskine\nStanley\nHydro Flask\nHerschel Supply Co\nTopo Designs\nCotopaxi\nSnow Peak\nFilson\nBlundstone\nBirkenstock\nRains\nFjällräven\nHAY\nGlossier'
const names = (text) => text.split(/\n+/).map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, '').trim()).filter(Boolean)

function Steps({ at }) {
  const steps = ['Your shop', 'Supplier list', 'Agent sorts it']
  return (
    <div className="steps-bar" aria-label="Steps">
      {steps.map((s, i) => (
        <span key={s} style={{ display: 'contents' }}>
          {i > 0 && <span className="sep" />}
          <span className={i === at ? 'on' : i < at ? 'done' : ''}><i>{i < at ? '✓' : i + 1}</i>{s}</span>
        </span>
      ))}
    </div>
  )
}

export default function NewDrop() {
  const { ws, ready, busy, ask, update } = useWorkspace()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [shop, setShop] = useState({ name: '', city: '', kind: SHOP_KINDS[0], loves: '' })
  const [order, setOrder] = useState({ name: '', supplier: '', list: '' })
  const [log, setLog] = useState([])
  const [question, setQuestion] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready) return
    if (ws.shop) {
      setShop({ ...ws.shop, loves: (ws.shop.loves || []).join(', ') })
      setStep(1)
    }
    if (ws.basket.length) setOrder((o) => ({ ...o, list: ws.basket.join('\n') }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const loves = shop.loves.split(/,|\n/).map((s) => s.trim()).filter(Boolean).slice(0, 5)
  const count = names(order.list).length
  const nextNumber = Math.max(0, ...ws.drops.map((d) => d.number)) + 1

  function saveShop(e) {
    e.preventDefault()
    update(() => ({ shop: { name: shop.name.trim(), city: shop.city.trim(), kind: shop.kind, loves }, sample: null }))
    setStep(1)
  }

  // Each turn's replies go into the run log; a "did you mean" stops for the owner; a drop opens.
  async function handle(result) {
    if (result.error) { setError(result.error); return }
    setLog((l) => [...l, ...result.replies.filter((r) => r.type === 'text').map((r) => r.text)])
    const made = result.replies.find((r) => r.type === 'drop')
    if (made) {
      update(() => ({ basket: [] }))
      router.push(`/app/drops/${made.drop.number}`)
      return
    }
    const pending = result.state?.pending?.[0]
    if (pending) setQuestion({ text: result.replies.filter((r) => r.type === 'text').at(-1)?.text, yes: result.chips[0], no: result.chips[1] })
  }

  async function run(e) {
    e.preventDefault()
    setStep(2); setLog([]); setError(''); setQuestion(null)
    const message = setupMessage({ city: shop.city.trim(), loves, list: names(order.list).join('\n') })
    handle(await ask(message, { state: { drops: nextNumber - 1 }, name: order.name.trim() || undefined, supplier: order.supplier.trim() }))
  }

  async function answer(text) {
    setQuestion(null)
    handle(await ask(text, { name: order.name.trim() || undefined, supplier: order.supplier.trim() }))
  }

  return (
    <>
      <Topbar crumbs={[{ label: 'Drops', href: '/app/drops' }, { label: 'New drop' }]} />
      <div className="page narrow">
        <div className="page-head"><div><h1>New drop</h1><p>Sort a supplier&apos;s brand list for your shop&apos;s crowd.</p></div></div>
        <Steps at={step} />

        {step === 0 && (
          <form className="card" onSubmit={saveShop}>
            <div className="card-h"><h2>Tell us about your shop</h2><span className="right faint" style={{ fontSize: 12 }}>You only do this once</span></div>
            <div className="card-b form-grid">
              <div className="form-grid two">
                <div className="field"><label htmlFor="shop-name">Shop name</label><input id="shop-name" className="input" required maxLength={60} value={shop.name} onChange={(e) => setShop({ ...shop, name: e.target.value })} placeholder="Mile High Goods" /></div>
                <div className="field"><label htmlFor="shop-kind">Type of shop</label><select id="shop-kind" className="select" value={shop.kind} onChange={(e) => setShop({ ...shop, kind: e.target.value })}>{SHOP_KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
              </div>
              <div className="field"><label htmlFor="shop-city">Where is it?</label><input id="shop-city" className="input" required maxLength={80} value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })} placeholder="Denver, Colorado" /><small>City and state or country. Works for the US, UK, Europe, Japan and Australia.</small></div>
              <div className="field"><label htmlFor="shop-loves">What do your customers already love?</label><input id="shop-loves" className="input" maxLength={200} value={shop.loves} onChange={(e) => setShop({ ...shop, loves: e.target.value })} placeholder="Patagonia, Carhartt, Tyler Childers" /><small>Up to 5 brands, musicians, shows or films, separated by commas. This is the strongest signal.</small></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn primary" disabled={!shop.name.trim() || !shop.city.trim()}>Continue</button></div>
            </div>
          </form>
        )}

        {step === 1 && (
          <form className="card" onSubmit={run}>
            <div className="card-h">
              <h2>Paste the supplier&apos;s brand list</h2>
              <span className="right"><button type="button" className="btn ghost sm" onClick={() => setStep(0)}>Edit shop</button></span>
            </div>
            <div className="card-b form-grid">
              <div className="meta" style={{ marginTop: 0 }}><span><b>{shop.name}</b></span><span>{shop.city}</span>{loves.length > 0 && <span>Customers love <b>{loves.join(', ')}</b></span>}</div>
              <div className="form-grid two">
                <div className="field"><label htmlFor="o-name">Drop name</label><input id="o-name" className="input" maxLength={60} value={order.name} onChange={(e) => setOrder({ ...order, name: e.target.value })} placeholder={`Order #${String(nextNumber).padStart(2, '0')}`} /></div>
                <div className="field"><label htmlFor="o-sup">Supplier or marketplace <span className="faint">(optional)</span></label><input id="o-sup" className="input" maxLength={60} value={order.supplier} onChange={(e) => setOrder({ ...order, supplier: e.target.value })} placeholder="e.g. a trade show or wholesale list" /></div>
              </div>
              <div className="field">
                <label htmlFor="o-list" style={{ display: 'flex', justifyContent: 'space-between' }}>Brands, one per line <span className="faint" style={{ fontWeight: 400 }}>{count} / 40</span></label>
                <textarea id="o-list" className="textarea mono" style={{ minHeight: 220, fontSize: 13 }} value={order.list} onChange={(e) => setOrder({ ...order, list: e.target.value })} placeholder={'Baggu\nFilson\nTopo Designs\n…'} />
                <small>Copy the brand column from any line sheet. Names Qloo isn&apos;t sure about are checked with you, never guessed. <button type="button" className="linky" onClick={() => setOrder({ ...order, list: SAMPLE_LIST })}>Use a sample list</button></small>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="btn primary" disabled={count < 3 || count > 40 || busy}><Icon name="bolt" size={14} /> Sort {count || ''} brands</button></div>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="card">
            <div className="card-h"><h2>Restocked is working</h2>{busy && <span className="right"><span className="spinner" /></span>}</div>
            <div className="card-b">
              <ul className="run-log">
                <li><span className="st">✓</span><span>Read your shop: {shop.city}{loves.length ? `, fans of ${loves.join(', ')}` : ''}.</span></li>
                {log.map((t, i) => <li key={i}><span className="st">✓</span><span>{t}</span></li>)}
                {busy && <li><span className="spinner" style={{ marginTop: 2 }} /><span className="mute">Looking up each brand on Qloo, one at a time…</span></li>}
              </ul>
              {question && !busy && (
                <div className="ask-box" style={{ marginTop: 16 }}>
                  <p>{question.text}</p>
                  <button className="btn sm primary" onClick={() => answer(question.yes)}>Yes</button>
                  <button className="btn sm" onClick={() => answer(question.no)}>No, leave it out</button>
                </div>
              )}
              {error && <div style={{ marginTop: 16 }}><p className="mute">{error}</p><button className="btn sm" onClick={() => setStep(1)}>Back to the list</button></div>}
              {!busy && !question && !error && log.length > 0 && <p className="mute" style={{ marginTop: 16 }}>The agent needs more to go on. <Link href="/app/agent">Continue in the agent</Link> or <button className="linky" onClick={() => setStep(1)}>edit the list</button>.</p>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
