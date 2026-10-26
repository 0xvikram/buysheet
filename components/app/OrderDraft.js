'use client'

import { useEffect, useState } from 'react'
import { orderDraft } from '../../lib/workspace.js'
import Icon from './Icon.js'

// Turns the drop into an order enquiry for the supplier's rep. Nothing is sent by Restocked:
// "Approve" opens the owner's own email app with the draft filled in.
export default function OrderDraft({ record, shop, onToast, onCsv }) {
  const [withConsider, setWithConsider] = useState(true)
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const draft = orderDraft(record, shop, { withConsider, from })
  const [body, setBody] = useState(draft.body)
  const [edited, setEdited] = useState(false)
  useEffect(() => {
    if (!edited) setBody(draft.body)
  }, [draft.body, edited])

  const mailto = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(body)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${draft.subject}\n\n${body}`); onToast('Draft copied') } catch { onToast('Could not copy') }
  }

  return (
    <div className="ov-grid">
      <div className="card">
        <div className="card-h"><h2>Order draft</h2><span className="right faint" style={{ fontSize: 12 }}>From your final calls</span></div>
        <div className="card-b form-grid">
          <div className="form-grid two">
            <div className="field"><label htmlFor="o-to">Supplier rep&apos;s email <span className="faint">(optional)</span></label><input id="o-to" className="input" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="rep@supplier.com" /></div>
            <div className="field"><label htmlFor="o-from">Sign as</label><input id="o-from" className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={shop?.name || 'Your name'} /></div>
          </div>
          <div className="field"><label>Subject</label><div className="input" style={{ background: 'var(--sunk)' }}>{draft.subject}</div></div>
          <div className="field">
            <label htmlFor="o-body" style={{ display: 'flex', justifyContent: 'space-between' }}>Message {edited && <button type="button" className="linky" style={{ fontWeight: 400 }} onClick={() => setEdited(false)}>Reset to draft</button>}</label>
            <textarea id="o-body" className="textarea" style={{ minHeight: 280 }} value={body} onChange={(e) => { setBody(e.target.value); setEdited(true) }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn primary" href={mailto}><Icon name="check" size={14} stroke={2.4} /> Approve and open in email</a>
            <button className="btn" onClick={copy}>Copy draft</button>
            <button className="btn" onClick={onCsv}><Icon name="download" size={14} /> Order sheet (CSV)</button>
          </div>
          <p className="faint" style={{ margin: 0, fontSize: 12.5 }}>Restocked never contacts suppliers. Approving opens your own email app with this draft; you send it.</p>
        </div>
      </div>
      <div className="card">
        <div className="card-h"><h2>In this order</h2></div>
        <div className="card-b">
          <div className="rv-group" style={{ marginTop: 0 }}><h3><span className="dot stock" />Ordering <span className="faint">{draft.stock.length}</span></h3><p>{draft.stock.length ? draft.stock.map((n) => <span key={n}>{n}</span>) : <span className="faint">Nothing marked stock yet</span>}</p></div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, fontSize: 13 }}>
            <input type="checkbox" checked={withConsider} onChange={(e) => setWithConsider(e.target.checked)} /> Ask about the brands I&apos;m still considering
          </label>
          {withConsider && <div className="rv-group"><h3><span className="dot consider" />Asking about <span className="faint">{draft.consider.length}</span></h3><p>{draft.consider.map((n) => <span key={n}>{n}</span>)}</p></div>}
          <p className="mute" style={{ fontSize: 12.5, marginTop: 16 }}>Change a call in the Table or Review tab and the draft updates.</p>
        </div>
      </div>
    </div>
  )
}
