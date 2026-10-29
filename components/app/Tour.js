'use client'

import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { BRAND } from '../../lib/brand.js'

// A guided tour of a drop for the sample shop: a pointer glides to each part of the page and a card
// explains it. Elements opt in with data-tour="…". Steps with `tab` switch the drop to that tab first.
export const TOUR_KEY = `${BRAND.slug}:tour-done`

const STEPS = [
  { target: 'row', title: 'Every brand, sorted', text: 'This is a real supplier list for a Denver gift shop. Each row is one brand with the agent’s call. Click a row to see exactly why.' },
  { target: 'ranks', title: 'Taste and city, from Qloo', text: 'Taste fit: how the brand ranks among fans of what this shop’s customers love. Local fit: how it ranks in Denver. Both come straight from Qloo.' },
  { target: 'bestseller', title: 'What a bestseller list would say', text: 'A popularity-only list, for comparison. Where it disagrees (⇄), that’s this shop’s crowd talking.' },
  { target: 'call', title: 'You make the final call', text: 'Tick, question mark or cross on any brand. The agent advises; the owner decides. Your calls feed the order.' },
  { target: 'tab-order', tab: 'order', title: 'Turn it into an order', text: 'Your calls become an email to the supplier’s rep. Approve it and it opens in your own email app. Restocked never sends anything itself.' },
  { target: 'tab-map', tab: 'map', title: 'Where else it would sell', text: 'Map any brand across 12 US cities to see where it’s strongest.' },
  { target: 'agent', tab: 'table', title: 'Ask the agent anything', text: 'Try “Why skip Baggu?”, “What if I opened in Austin?” or “Who buys Stanley?”. Every answer shows the Qloo data behind it.' },
]

const visible = (el) => el && el.getBoundingClientRect().width > 0

export default function Tour({ onTab, onClose }) {
  const calm = useReducedMotion()
  const [i, setI] = useState(0)
  const [box, setBox] = useState(null)
  const [phone, setPhone] = useState(false)
  const step = STEPS[i]

  const measure = useCallback(() => {
    const el = [...document.querySelectorAll(`[data-tour="${step.target}"]`)].find(visible)
    setPhone(innerWidth < 700)
    if (!el) { setBox(null); return }
    const r = el.getBoundingClientRect()
    setBox({ x: r.left, y: r.top, w: r.width, h: r.height })
  }, [step.target])

  useEffect(() => {
    if (step.tab) onTab(step.tab)
    const t = setTimeout(() => {
      const el = [...document.querySelectorAll(`[data-tour="${step.target}"]`)].find(visible)
      el?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' })
      setTimeout(measure, calm ? 0 : 450)
    }, 60)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  useEffect(() => {
    addEventListener('resize', measure)
    addEventListener('scroll', measure, true)
    return () => { removeEventListener('resize', measure); removeEventListener('scroll', measure, true) }
  }, [measure])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'Enter' && document.activeElement?.tagName !== 'A') next()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  function finish() {
    try { localStorage.setItem(TOUR_KEY, '1') } catch { /* private mode: the tour may show again */ }
    onTab('table')
    onClose()
  }
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish())

  // the card sits below the target when there's room, otherwise above; on phones it docks at the bottom
  const W = 320
  const card = !box || phone
    ? { left: 12, right: 12, bottom: 12 }
    : {
        left: Math.max(12, Math.min(innerWidth - W - 12, box.x + box.w / 2 - W / 2)),
        ...(box.y + box.h + 210 < innerHeight ? { top: box.y + box.h + 16 } : { top: Math.max(12, box.y - 196) }),
        width: W,
      }
  const point = box ? { x: box.x + Math.min(box.w / 2, 120), y: box.y + box.h / 2 } : null

  return (
    <div className="tour" role="dialog" aria-label="Guided tour" aria-live="polite">
      {box && (
        <motion.div
          className="tour-ring"
          animate={{ left: box.x - 6, top: box.y - 6, width: box.w + 12, height: box.h + 12 }}
          transition={calm ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 22 }}
        />
      )}
      {point && !phone && (
        <motion.div
          className="tour-pointer"
          initial={false}
          animate={{ x: point.x, y: point.y }}
          transition={calm ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16 }}
          aria-hidden="true"
        >
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.5L10 19z" fill="#D4FF3F" stroke="#0B0B0B" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          {!calm && <motion.span key={i} className="tour-click" initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.9, delay: 0.5, repeat: Infinity, repeatDelay: 1.2 }} />}
        </motion.div>
      )}
      <motion.div key={i} className="tour-card card" style={card} initial={calm ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="tour-top"><span className="mono faint">{i + 1} / {STEPS.length}</span><button className="linky" onClick={finish}>Skip tour</button></div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour-dots" aria-hidden="true">{STEPS.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}</div>
        <div className="tour-acts">
          {i > 0 && <button className="btn sm" onClick={() => setI(i - 1)}>Back</button>}
          {i < STEPS.length - 1
            ? <button className="btn primary sm" onClick={next} autoFocus>Next</button>
            : <><button className="btn sm" onClick={finish}>Explore on my own</button><Link className="btn primary sm" href="/app/new" onClick={finish}>Set up my shop</Link></>}
        </div>
      </motion.div>
    </div>
  )
}
