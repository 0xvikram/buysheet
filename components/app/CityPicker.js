'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.js'
import { useActive, useSuggest } from './useSuggest.js'

// Type a few letters, pick a city; then a single Qloo call checks there is local taste data for it.
// status: idle | checking | ok | no | error, reported to the form so it can hold Continue back.
export default function CityPicker({ id, value, onChange, onStatus }) {
  const [text, setText] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(value ? 'ok' : 'idle')
  const [examples, setExamples] = useState([])
  const checked = useRef(value || '')
  const { options, loading } = useSuggest('city', open ? text : '')
  const nav = useActive(options.length)

  // only a change from outside (a saved shop loading) resets the field; our own picks don't
  useEffect(() => {
    if ((value || '') === checked.current) return
    setText(value || '')
    checked.current = value || ''
    setStatus(value ? 'ok' : 'idle')
  }, [value])
  useEffect(() => { onStatus?.(status) }, [status, onStatus])

  async function confirm(label) {
    const place = label.trim()
    setText(place)
    setOpen(false)
    if (!place) { checked.current = ''; onChange(''); setStatus('idle'); return }
    if (checked.current === place && status === 'ok') return
    checked.current = place
    onChange(place)
    setExamples([])
    setStatus('checking')
    try {
      const d = await (await fetch(`/api/suggest?kind=coverage&q=${encodeURIComponent(place)}`)).json()
      if (checked.current !== place) return
      if (d.error) { setStatus('error'); return }
      setExamples(d.examples || [])
      setStatus(d.covered ? 'ok' : 'no')
    } catch {
      if (checked.current === place) setStatus('error')
    }
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); nav.move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.move(-1) }
    else if (e.key === 'Enter') { e.preventDefault(); confirm(open && options[nav.ref.current] ? options[nav.ref.current].label : text) }
    else if (e.key === 'Escape') setOpen(false)
  }

  const city = text.split(',')[0]
  return (
    <div className="combo">
      <div className={`combo-field${status === 'no' ? ' bad' : status === 'ok' ? ' good' : ''}`}>
        <Icon name="map" size={15} />
        <input
          id={id}
          className="combo-input"
          value={text}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          placeholder="Start typing a city, e.g. Denver"
          onChange={(e) => { setText(e.target.value); setOpen(true); if (status !== 'idle') setStatus('idle') }}
          onFocus={() => text && setOpen(true)}
          onBlur={() => setTimeout(() => { setOpen(false); if (text.trim() && text.trim() !== checked.current) confirm(text) }, 150)}
          onKeyDown={onKey}
        />
        {(loading || status === 'checking') && <span className="spinner" aria-hidden="true" />}
        {status === 'ok' && <span className="combo-ok"><Icon name="check" size={14} stroke={2.6} /></span>}
      </div>
      {open && options.length > 0 && (
        <ul className="dd-list" role="listbox" id={`${id}-list`}>
          {options.map((o, i) => (
            <li key={o.label} role="option" aria-selected={i === nav.active} className={i === nav.active ? 'active' : ''} onPointerEnter={() => nav.set(i)} onPointerDown={(e) => { e.preventDefault(); confirm(o.label) }}>
              <span><b style={{ fontWeight: 600 }}>{o.label.split(',')[0]}</b><span className="faint">{o.label.slice(o.label.split(',')[0].length)}</span></span>
            </li>
          ))}
        </ul>
      )}
      <p className={`combo-note ${status}`} aria-live="polite">
        {status === 'ok' && <>We have local taste data for {city}{examples.length ? <> · people there over-index on {examples.join(', ')}</> : null}.</>}
        {status === 'no' && <>We&apos;re not operating in {city} yet: Qloo has no local taste data for that place. Try the nearest larger city.</>}
        {status === 'checking' && <>Checking Qloo has local data for {city}…</>}
        {status === 'error' && <>Couldn&apos;t check this city right now. You can continue; the agent will tell you if it has no local data.</>}
        {status === 'idle' && <>Start typing and pick your city from the list.</>}
      </p>
    </div>
  )
}
