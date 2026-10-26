'use client'

import { useEffect, useRef, useState } from 'react'
import { GROUPS } from '../../lib/grade.js'
import Icon from './Icon.js'

// Review a drop one brand at a time: the agent's call and reasons, then the owner's call.
// Keys: ← skip, ↑ consider, → stock. On touch, swipe the card.

const FLING = 100

export default function Review({ rows, calls, onCall, onDone }) {
  const list = rows.filter((r) => r.group !== 'nosignal')
  const todo = list.filter((r) => !calls[r.id])
  const card = todo[0]
  const [drag, setDrag] = useState(null)
  const [leaving, setLeaving] = useState(null)
  const start = useRef(null)

  function choose(group) {
    if (!card || leaving) return
    setLeaving({ id: card.id, group })
    setDrag(null)
    setTimeout(() => {
      onCall(card.id, group)
      setLeaving(null)
    }, 200)
  }
  const undo = () => {
    const last = list.filter((r) => calls[r.id]).at(-1)
    if (last) onCall(last.id, null)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('textarea, input')) return
      if (e.key === 'ArrowRight') choose('stock')
      else if (e.key === 'ArrowLeft') choose('skip')
      else if (e.key === 'ArrowUp') { e.preventDefault(); choose('consider') }
      else if (e.key.toLowerCase() === 'z') undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const done = list.length - todo.length
  if (!card) {
    const mine = (g) => list.filter((r) => calls[r.id] === g)
    const agreed = list.filter((r) => calls[r.id] === r.group).length
    return (
      <div className="review">
        <div className="card rv-done">
          <h2>Review complete</h2>
          <p className="mute" style={{ margin: 0 }}>You agreed with the agent on {agreed} of {list.length} brands. Outlined brands are where you overruled it.</p>
          {['stock', 'consider', 'skip'].map((g) => (
            <div key={g} className="rv-group">
              <h3><span className={`dot ${g}`} />{GROUPS[g]} <span className="faint">{mine(g).length}</span></h3>
              <p>{mine(g).length ? mine(g).map((r) => <span key={r.id} className={r.group !== g ? 'changed' : ''} title={r.group !== g ? `Agent said ${GROUPS[r.group].toLowerCase()}` : undefined}>{r.name}</span>) : <span className="faint" style={{ background: 'none', padding: 0 }}>None</span>}</p>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {onDone}
            <button className="btn" onClick={undo}><Icon name="undo" size={14} /> Undo last</button>
          </div>
        </div>
      </div>
    )
  }

  const shown = (leaving && list.find((r) => r.id === leaving.id)) || card
  const dx = leaving ? { stock: 600, skip: -600, consider: 0 }[leaving.group] : drag?.x ?? 0
  const dy = leaving ? (leaving.group === 'consider' ? -500 : 0) : Math.min(0, drag?.y ?? 0)
  const lean = drag ? (drag.x > 50 ? 'stock' : drag.x < -50 ? 'skip' : drag.y < -50 ? 'consider' : null) : null

  return (
    <div className="review">
      <div className="review-top">
        <span className="mono">{done + 1} of {list.length}</span>
        <div className="meter"><i style={{ width: `${(done / list.length) * 100}%` }} /></div>
        <button className="btn ghost sm" onClick={undo} disabled={!done}><Icon name="undo" size={13} /> Undo</button>
      </div>
      <article
        key={shown.id}
        className={`card rv-card${drag ? ' dragging' : ''}${leaving ? ' leaving' : ''}`}
        style={{ transform: `translate(${dx}px, ${dy}px) rotate(${dx / 30}deg)` }}
        onPointerDown={(e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; start.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture?.(e.pointerId); setDrag({ x: 0, y: 0 }) }}
        onPointerMove={(e) => start.current && setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })}
        onPointerUp={() => {
          if (!start.current || !drag) return
          start.current = null
          if (drag.x > FLING) choose('stock')
          else if (drag.x < -FLING) choose('skip')
          else if (drag.y < -FLING) choose('consider')
          else setDrag(null)
        }}
        onPointerCancel={() => { start.current = null; setDrag(null) }}
        aria-live="polite"
      >
        {lean && <span className={`badge ${lean} rv-stamp`}>{GROUPS[lean]}</span>}
        <span className="faint" style={{ fontSize: 12.5 }}>Agent says</span> <span className={`badge ${shown.group}`}>{GROUPS[shown.group]}</span>
        <h2>{shown.name}</h2>
        <ul>{shown.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
      </article>
      <div className="rv-actions">
        <button className="btn" onClick={() => choose('skip')}><Icon name="x" size={14} stroke={2.4} /> Skip <span className="kbd">←</span></button>
        <button className="btn" onClick={() => choose('consider')}><Icon name="question" size={14} stroke={2.4} /> Consider <span className="kbd">↑</span></button>
        <button className="btn primary" onClick={() => choose('stock')}><Icon name="check" size={14} stroke={2.4} /> Stock <span className="kbd" style={{ background: 'transparent', color: 'inherit', borderColor: 'currentColor', opacity: 0.6 }}>→</span></button>
      </div>
    </div>
  )
}
