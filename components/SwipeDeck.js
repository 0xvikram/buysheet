'use client'

import { useEffect, useRef, useState } from 'react'
import { GROUPS } from '../lib/grade.js'
import { BRAND } from '../lib/brand.js'

// One brand per card. The agent's call is shown; the owner makes the final one.
// Right = stock, left = skip, up = consider. Buttons and arrow keys do the same.

const keyFor = (drop) => `${BRAND.slug}:swipes:${drop.number}:${drop.title}`
const load = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || '{}')
  } catch {
    return {}
  }
}
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    // private mode: choices still work for this visit
  }
}

const DIRS = { stock: [1, 0], skip: [-1, 0], consider: [0, -1] }
const FLING = 110

export default function SwipeDeck({ drop, onShare }) {
  const rows = drop.sheet.rows.filter((r) => r.group !== 'nosignal')
  const storeKey = keyFor(drop)
  const [picks, setPicks] = useState({})
  const [drag, setDrag] = useState(null) // { x, y } while a finger is down
  const [leaving, setLeaving] = useState(null) // { id, group } while a card flies off
  const [copied, setCopied] = useState(false)
  const start = useRef(null)

  useEffect(() => setPicks(load(storeKey)), [storeKey])

  const left = rows.filter((r) => !picks[r.id])
  const card = left[0]

  function choose(group) {
    if (!card || leaving) return
    setLeaving({ id: card.id, group })
    setDrag(null)
    setTimeout(() => {
      setPicks((p) => {
        const next = { ...p, [card.id]: group }
        save(storeKey, next)
        return next
      })
      setLeaving(null)
    }, 260)
  }

  function undo() {
    const done = rows.filter((r) => picks[r.id])
    const last = done.at(-1)
    if (!last) return
    setPicks((p) => {
      const next = { ...p }
      delete next[last.id]
      save(storeKey, next)
      return next
    })
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('textarea, input')) return
      if (e.key === 'ArrowRight') choose('stock')
      if (e.key === 'ArrowLeft') choose('skip')
      if (e.key === 'ArrowUp') { e.preventDefault(); choose('consider') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const down = (e) => {
    if (leaving) return
    start.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ x: 0, y: 0 })
  }
  const move = (e) => start.current && setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  const up = () => {
    if (!start.current || !drag) return
    start.current = null
    if (drag.x > FLING) choose('stock')
    else if (drag.x < -FLING) choose('skip')
    else if (drag.y < -FLING) choose('consider')
    else setDrag(null)
  }

  const leaningTo = drag ? (drag.x > 50 ? 'stock' : drag.x < -50 ? 'skip' : drag.y < -50 ? 'consider' : null) : null

  if (!card && !leaving) {
    const mine = (g) => rows.filter((r) => picks[r.id] === g)
    const agreed = rows.filter((r) => picks[r.id] === r.group).length
    const order = mine('stock').map((r) => r.name)
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(`${drop.title}\n\nStock:\n${order.join('\n')}\n\nConsider:\n${mine('consider').map((r) => r.name).join('\n')}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      } catch {
        setCopied(false)
      }
    }
    return (
      <section className="deck-done" aria-label="Your order">
        <p className="kicker">Your order is ready</p>
        <h2 className="display">{order.length} to stock</h2>
        <p className="mute">You agreed with the agent on {agreed} of {rows.length} brands.</p>
        {['stock', 'consider', 'skip'].map((g) => (
          <div key={g} className={`done-group ${g}`}>
            <h3>{GROUPS[g]} <span>{mine(g).length}</span></h3>
            <p>{mine(g).map((r) => (
              <span key={r.id} className={r.group !== g ? 'changed' : ''} title={r.group !== g ? `The agent said ${GROUPS[r.group].toLowerCase()}` : undefined}>{r.name}</span>
            ))}{!mine(g).length && <span className="none">None</span>}</p>
          </div>
        ))}
        <p className="mute small">Underlined brands are where you overruled the agent.</p>
        <div className="deck-actions">
          <button className="btn lime" onClick={copy}>{copied ? 'Copied' : 'Copy my order'}</button>
          {onShare && <button className="btn" onClick={onShare}>Share this drop</button>}
          <button className="btn" onClick={() => { setPicks({}); save(storeKey, {}) }}>Start over</button>
        </div>
      </section>
    )
  }

  const flying = leaving && rows.find((r) => r.id === leaving.id)
  const shown = flying || card
  const behind = left.filter((r) => r.id !== shown.id).slice(0, 2)
  const done = rows.length - left.length
  const [dx, dy] = leaving ? DIRS[leaving.group].map((v) => v * 700) : [drag?.x ?? 0, drag?.y ?? 0]

  return (
    <section className="deck" aria-label="Swipe through the drop">
      <div className="deck-top">
        <span className="mono">{Math.min(done + 1, rows.length)} / {rows.length}</span>
        <div className="deck-bar"><i style={{ width: `${(done / rows.length) * 100}%` }} /></div>
        <button className="linkish" onClick={undo} disabled={!done}>Undo</button>
      </div>
      <div className="stack">
        {behind.map((r, i) => (
          <div key={r.id} className="swipe-card ghost" style={{ transform: `translateY(${(i + 1) * 12}px) scale(${1 - (i + 1) * 0.04})`, zIndex: 2 - i }} aria-hidden="true" />
        ))}
        <article
          key={shown.id}
          className={`swipe-card${drag ? ' dragging' : ''}${leaving ? ' leaving' : ''}`}
          style={{ transform: `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`, zIndex: 5 }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => { start.current = null; setDrag(null) }}
          aria-live="polite"
        >
          {leaningTo && <span className={`stamp ${leaningTo}`}>{GROUPS[leaningTo]}</span>}
          <p className={`agent-says ${shown.group}`}>Agent says <b>{GROUPS[shown.group]}</b></p>
          <h2 className="display">{shown.name}</h2>
          <ul>
            {shown.reasons.length ? shown.reasons.map((x) => <li key={x}>{x}</li>) : <li>Open the agent tab to ask why.</li>}
          </ul>
          <p className="swipe-hint mono">← skip · ↑ consider · stock →</p>
        </article>
      </div>
      <div className="deck-buttons">
        <button className="round skip" onClick={() => choose('skip')} aria-label={`Skip ${shown.name}`}>✕</button>
        <button className="round consider" onClick={() => choose('consider')} aria-label={`Consider ${shown.name}`}>?</button>
        <button className="round stock" onClick={() => choose('stock')} aria-label={`Stock ${shown.name}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </section>
  )
}
