'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon.js'

/**
 * A dropdown in the app's own style, replacing the browser's native one.
 * Keyboard: ↑ ↓ to move, Enter or Space to pick, Esc to close, a letter jumps to the first option starting with it.
 */
export default function Select({ id, value, options, onChange, label, className = '' }) {
  const [active, setActiveState] = useState(Math.max(0, options.indexOf(value)))
  const [open, setOpenState] = useState(false)
  // refs mirror the state so fast key presses always read the latest position
  const activeRef = useRef(active)
  const openRef = useRef(false)
  const setActive = (v) => { activeRef.current = typeof v === 'function' ? v(activeRef.current) : v; setActiveState(activeRef.current) }
  const setOpen = (v) => { openRef.current = v; setOpenState(v) }
  const box = useRef(null)
  const list = useRef(null)
  const auto = useId()
  const listId = `${id || auto}-list`

  useEffect(() => {
    if (!open) return
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const pick = (i) => {
    onChange(options[i])
    setOpen(false)
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!openRef.current) { setOpen(true); setActive(Math.max(0, options.indexOf(value))); return }
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (openRef.current) pick(activeRef.current)
      else { setOpen(true); setActive(Math.max(0, options.indexOf(value))) }
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Tab') {
      setOpen(false)
    } else if (/^[a-z0-9]$/i.test(e.key)) {
      // the same letter again moves on to the next option starting with it
      const from = openRef.current ? activeRef.current : options.indexOf(value)
      const order = options.map((_, k) => (from + 1 + k) % options.length)
      const i = order.find((k) => options[k].toLowerCase().startsWith(e.key.toLowerCase()))
      if (i !== undefined) { setActive(i); if (!openRef.current) onChange(options[i]) }
    }
  }

  return (
    <div className={`dd${open ? ' open' : ''} ${className}`} ref={box}>
      <button
        type="button"
        id={id}
        className="dd-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => { setOpen(!openRef.current); setActive(Math.max(0, options.indexOf(value))) }}
        onKeyDown={onKey}
      >
        <span>{value}</span>
        <span className="dd-chev" aria-hidden="true"><Icon name="chevrons" size={14} /></span>
      </button>
      {open && (
        <ul className="dd-list" role="listbox" id={listId} ref={list} aria-label={label} aria-activedescendant={`${listId}-${active}`}>
          {options.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o === value}
              className={i === active ? 'active' : ''}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => { e.preventDefault(); pick(i) }}
            >
              <span>{o}</span>
              {o === value && <Icon name="check" size={14} stroke={2.4} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
