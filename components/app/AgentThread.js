'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import CityMap from '../CityMap.js'
import Mark from '../Mark.js'
import Icon from './Icon.js'
import { useWorkspace } from './Workspace.js'

const STARTERS = ['Where does Filson fit?', 'Who buys Le Labo?', 'Snow Peak vs Cotopaxi', 'Find brands like Patagonia']

function Reply({ r, onAsk, onBasket }) {
  if (r.type === 'drop') {
    return (
      <div className="m-card">
        <h5>{r.drop.whatIf ? 'What-if drop' : 'New drop'} #{String(r.drop.number).padStart(2, '0')}</h5>
        <b style={{ fontWeight: 500 }}>{r.drop.title}</b>
        <p>{r.drop.sheet.counts.stock} stock · {r.drop.sheet.counts.consider} consider · {r.drop.sheet.counts.skip} skip</p>
        <p style={{ marginTop: 8 }}><Link className="linky" href={`/app/drops/${r.drop.number}`}>Open drop</Link></p>
      </div>
    )
  }
  if (r.type === 'map') {
    return (
      <div className="m-card">
        <h5>Where {r.map.brand.name} fits</h5>
        <CityMap map={r.map} compact />
        <Link className="linky" href={`/app/map?brand=${encodeURIComponent(r.map.brand.name)}`}>Open in Market map</Link>
      </div>
    )
  }
  if (r.type === 'compare') {
    const { a, b } = r.compare
    const side = (x) => <div><b style={{ fontWeight: 600 }}>{x.name}</b><p>{x.lean}</p>{x.stands.length > 0 && <p>Stands out for: {x.stands.join(', ')}</p>}</div>
    return <div className="m-card"><h5>Side by side</h5><div className="cols">{side(a)}{side(b)}</div></div>
  }
  if (r.type === 'similar') {
    return (
      <div className="m-card">
        <h5>Also loved by this crowd</h5>
        <ul>
          {r.similar.brands.map((x) => (
            <li key={x.id}>
              <button className="linky" onClick={() => onBasket(x.name)}>{x.name}</button>
              {x.about ? <span className="mute">: {x.about}</span> : null}
            </li>
          ))}
        </ul>
        <p>Tap a brand to add it to your next drop.</p>
      </div>
    )
  }
  return null
}

/** A message from the owner. A pasted brand list shows as a summary that opens on click. */
function Mine({ text }) {
  const [open, setOpen] = useState(false)
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 4) return <div className="m-me">{text}</div>
  const prose = /[a-z]{3,}\s[a-z]{2,}\s/i.test(lines[0]) && lines[0].length > 30 ? lines[0] : ''
  const brands = prose ? lines.slice(1) : lines
  return (
    <div className="m-me m-list">
      {prose && <span className="m-prose">{prose}</span>}
      <button type="button" className="m-chip" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="list" size={13} /> {brands.length} brands pasted <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && <span className="m-brands">{brands.join(' · ')}</span>}
    </div>
  )
}

/** Groups consecutive bot messages so each answer reads as one bubble. */
function groups(messages) {
  const out = []
  for (const m of messages) {
    const last = out.at(-1)
    if (m.from !== 'me' && last && last.from === 'bot') last.items.push(m)
    else out.push(m.from === 'me' ? { from: 'me', text: m.text } : { from: 'bot', items: [m] })
  }
  return out
}

/** The agent conversation. `stateFor()` can adjust the state sent (a drop page pins its own drop). */
export default function AgentThread({ full = false, stateFor, title = 'Ask Restocked' }) {
  const { ws, busy, ask, update, setToast } = useWorkspace()
  const [draft, setDraft] = useState('')
  const log = useRef(null)
  const { messages, chips } = ws.agent

  const first = useRef(true)
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: first.current ? 'auto' : 'smooth' })
    first.current = false
  }, [messages.length, busy])

  const send = (text) => {
    const t = (text === 'Try again' ? messages.filter((m) => m.from === 'me').at(-1)?.text : text) || ''
    if (!t.trim() || busy) return
    setDraft('')
    ask(t, stateFor ? { state: stateFor(ws.agent.state) } : {})
  }
  const toBasket = (name) => {
    update((w) => ({ basket: [...new Set([...w.basket, name])] }))
    setToast(`${name} added to your next drop`)
  }
  const suggestions = chips.length ? chips : messages.length ? [] : STARTERS

  return (
    <section className={`agent-panel${full ? ' full' : ''}`} aria-label="Agent">
      {!full && <div className="ap-head">{title}<span className="live" aria-hidden="true" /><small>Agent · Qloo data</small></div>}
      <div className="thread" ref={log} aria-live="polite">
        {!messages.length && (
          <div className="m-group">
            <div className="who"><Mark size={14} /> Restocked</div>
            <div className="m-bubble"><p>I&apos;m your buying agent. Ask why a brand landed where it did, what changes in another city, where a brand fits, who buys it, or for new brands your crowd would like.</p></div>
          </div>
        )}
        {groups(messages).map((g, i) => (
          g.from === 'me'
            ? <Mine key={i} text={g.text} />
            : (
              <div key={i} className="m-group">
                <div className="who"><Mark size={14} /> Restocked</div>
                <div className="m-bubble">
                  {g.items.map((m, j) => (
                    m.reply
                      ? <Reply key={j} r={m.reply} onAsk={send} onBasket={toBasket} />
                      : <p key={j} className={`${m.err ? 'err' : ''}${/^Quick check:/.test(m.text) ? ' ask' : ''}`}>{m.text}</p>
                  ))}
                </div>
              </div>
            )
        ))}
        {busy && <div className="typing"><span className="dots" aria-hidden="true"><i /><i /><i /></span> Asking Qloo…</div>}
      </div>
      {suggestions.length > 0 && !busy && (
        <div className="sugg">{suggestions.slice(0, 5).map((c) => <button key={c} className="chip" onClick={() => send(c)}>{c}</button>)}</div>
      )}
      <form className="composer" data-tour="agent" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
        <label htmlFor={full ? 'say-full' : 'say'} className="sr-only">Message the agent</label>
        <textarea
          id={full ? 'say-full' : 'say'}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) } }}
          placeholder="Ask about any brand…"
        />
        <button className="send" disabled={busy || !draft.trim()} aria-label="Send"><Icon name="send" size={15} stroke={2.2} /></button>
      </form>
    </section>
  )
}
