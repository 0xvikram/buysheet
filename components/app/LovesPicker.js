'use client'

import { useState } from 'react'
import Icon from './Icon.js'
import { useActive, useSuggest } from './useSuggest.js'

// What the shop's customers already love: suggestions as you type (brands, artists, shows, films),
// picks shown as pills with ×. Enter adds the highlighted suggestion, or the typed name if none fits.
const POPULAR = ['Patagonia', 'Carhartt', 'Tyler Childers', 'Glossier', 'Taylor Swift', 'Le Labo', 'Yellowstone', 'Bad Bunny', 'Phoebe Bridgers', 'Aesop']
const MAX = 5

export default function LovesPicker({ id, values, onChange }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const { options, loading } = useSuggest('love', open ? text : '')
  const fresh = options.filter((o) => !values.some((v) => v.toLowerCase() === o.name.toLowerCase()))
  const nav = useActive(fresh.length)
  const full = values.length >= MAX

  const add = (name) => {
    const n = name.trim()
    if (!n || full || values.some((v) => v.toLowerCase() === n.toLowerCase())) { setText(''); return }
    onChange([...values, n])
    setText('')
  }
  const remove = (n) => onChange(values.filter((v) => v !== n))

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); nav.move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.move(-1) }
    else if (e.key === 'Enter' || (e.key === ',' && text.trim())) { e.preventDefault(); add(open && fresh[nav.ref.current] ? fresh[nav.ref.current].name : text) }
    else if (e.key === 'Backspace' && !text && values.length) remove(values.at(-1))
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="combo">
      <div className="combo-field pills-field" onClick={() => document.getElementById(id)?.focus()}>
        {values.map((v) => (
          <span key={v} className="pill">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={(e) => { e.stopPropagation(); remove(v) }}><Icon name="x" size={12} stroke={2.6} /></button>
          </span>
        ))}
        {!full && (
          <input
            id={id}
            className="combo-input"
            value={text}
            autoComplete="off"
            role="combobox"
            aria-expanded={open && fresh.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            placeholder={values.length ? 'Add another…' : 'Type a brand, musician, show or film'}
            onChange={(e) => { setText(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKey}
          />
        )}
        {loading && <span className="spinner" aria-hidden="true" />}
      </div>
      {open && fresh.length > 0 && !full && (
        <ul className="dd-list" role="listbox" id={`${id}-list`}>
          {fresh.map((o, i) => (
            <li key={`${o.name}|${o.type}`} role="option" aria-selected={i === nav.active} className={i === nav.active ? 'active' : ''} onPointerEnter={() => nav.set(i)} onPointerDown={(e) => { e.preventDefault(); add(o.name) }}>
              <span style={{ minWidth: 0 }}><b style={{ fontWeight: 600 }}>{o.name}</b>{o.about && <span className="faint dd-about"> · {o.about}</span>}</span>
              <span className="badge plain">{o.type}</span>
            </li>
          ))}
        </ul>
      )}
      {!full && !text && (
        <div className="quick-picks" aria-label="Popular picks">
          {POPULAR.filter((p) => !values.includes(p)).slice(0, 6).map((p) => <button type="button" key={p} className="chip" onClick={() => add(p)}>+ {p}</button>)}
        </div>
      )}
      <p className="combo-note">{full ? 'That’s 5, the most Qloo uses. Remove one to add another.' : `Up to ${MAX}. The strongest signal for your drops.`}</p>
    </div>
  )
}
