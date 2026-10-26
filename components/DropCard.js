'use client'

import { useState } from 'react'
import { GROUPS } from '../lib/grade.js'

const ORDER = ['stock', 'consider', 'skip', 'nosignal']

const Tick = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** The buy sheet as a numbered "Drop". Tap a brand for its reasons. */
export default function DropCard({ drop, interactive = true, limit }) {
  const [open, setOpen] = useState(null)
  const rows = drop.sheet.rows
  const b = drop.baseline
  return (
    <article className="drop" aria-label={`Drop ${drop.number}`}>
      <header className="drop-head">
        <div className="drop-no">
          <small>{drop.whatIf ? 'What-if drop' : 'Buy sheet'}</small>
          #{String(drop.number).padStart(2, '0')}
        </div>
        <div className="drop-title">
          {drop.title}
          {drop.whatIf && <div><span className="tag">what if</span></div>}
        </div>
      </header>
      <div className="groups">
        {ORDER.map((g) => {
          const items = rows.filter((r) => r.group === g)
          if (g === 'nosignal' && !items.length) return null
          const shown = limit ? items.slice(0, limit) : items
          return (
            <section key={g} className={`group ${g}`}>
              <h4>{GROUPS[g]} <span>{items.length}</span></h4>
              <ul>
                {shown.map((r) => (
                  <li key={r.id}>
                    {interactive ? (
                      <button className="item" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                        <span className="pip">{g === 'stock' ? <Tick /> : null}</span>
                        <span className="name">{r.name}</span>
                      </button>
                    ) : (
                      <span className="item"><span className="pip">{g === 'stock' ? <Tick /> : null}</span><span className="name">{r.name}</span></span>
                    )}
                    {open === r.id && <ul className="reasons">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
                  </li>
                ))}
                {limit && items.length > limit && <li className="empty">+{items.length - limit} more</li>}
                {!items.length && <li className="empty">None</li>}
              </ul>
            </section>
          )
        })}
      </div>
      {b?.compared > 0 && (
        <p className="drop-foot">
          {b.flips.length ? (
            <>A generic bestseller list makes the <b>opposite call on {b.flips.map((f) => f.name).join(', ')}</b>. That&apos;s your crowd talking.</>
          ) : (
            <>A generic bestseller list agrees on <b>{b.same} of {b.compared}</b>: your crowd is close to the average shopper here.</>
          )}
          {interactive && ' Tap any brand for its reasons.'}
        </p>
      )}
    </article>
  )
}
