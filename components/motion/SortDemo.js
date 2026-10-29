'use client'

import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// A live loop of what the agent does: brands leave the supplier list one by one and land in
// stock, consider or skip. The calls are the real Denver drop (public/examples/denver.json).
const COLS = [['stock', 'Stock'], ['consider', 'Consider'], ['skip', 'Skip']]

export default function SortDemo({ rows }) {
  const ref = useRef(null)
  const seen = useInView(ref, { margin: '-80px' })
  const calm = useReducedMotion()
  const [done, setDone] = useState(calm ? rows.length : 0)

  useEffect(() => {
    if (calm || !seen) return
    const t = setTimeout(() => setDone((d) => (d >= rows.length ? 0 : d + 1)), done >= rows.length ? 2600 : done === 0 ? 900 : 520)
    return () => clearTimeout(t)
  }, [done, seen, calm, rows.length])

  const left = rows.slice(done)
  const placed = rows.slice(0, done)
  const chip = (r) => (
    <motion.span key={r.name} layoutId={`chip-${r.name}`} className={`demo-chip ${placed.includes(r) ? r.group : ''}`} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
      {r.name}
    </motion.span>
  )

  return (
    <div className="demo glass" ref={ref}>
      <div className="demo-head">
        <span className="live-dot" /> Agent sorting · Denver gift shop · fans of Patagonia, Carhartt, Tyler Childers
        <span className="demo-count mono">{done}/{rows.length}</span>
      </div>
      <LayoutGroup>
        <div className="demo-body">
          <div className="demo-col incoming">
            <h4>Supplier list</h4>
            <div className="demo-chips"><AnimatePresence>{left.map(chip)}</AnimatePresence></div>
          </div>
          {COLS.map(([g, label]) => (
            <div key={g} className={`demo-col ${g}`}>
              <h4><i className={`dot ${g}`} />{label}</h4>
              <div className="demo-chips">{placed.filter((r) => r.group === g).map(chip)}</div>
            </div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}
