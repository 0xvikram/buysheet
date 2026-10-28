'use client'

import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// Counts every number inside a label up from zero ("585,925", "3.2M", "1 in 1,000", "38 / 46"),
// keeping its commas and decimals, the first time it is seen. `value` changes animate from the old value.
// The real value is always what renders first, so a number is never stuck at zero before it animates.
const NUM = /\d[\d,]*(?:\.\d+)?/g
const fmt = (n, like) => {
  const decimals = like.includes('.') ? like.split('.')[1].length : 0
  const s = n.toFixed(decimals)
  return like.includes(',') ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s
}
const render = (text, p, from) => {
  let i = 0
  return text.replace(NUM, (m) => {
    const to = Number(m.replace(/,/g, ''))
    const start = from ? Number((from.match(NUM)?.[i++] || '0').replace(/,/g, '')) : 0
    return fmt(start + (to - start) * p, m)
  })
}

export default function CountUp({ value, duration = 1.4 }) {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, margin: '-40px' })
  const calm = useReducedMotion()
  const last = useRef(null)
  const [text, setText] = useState(String(value))
  useEffect(() => {
    const target = String(value)
    if (calm || !seen) { setText(target); return }
    const from = last.current
    if (from === target) return
    last.current = target
    const c = animate(0, 1, { duration: from ? 0.6 : duration, ease: [0.2, 0.8, 0.2, 1], onUpdate: (p) => setText(render(target, p, from)) })
    return () => c.stop()
  }, [value, seen, calm, duration])
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</span>
}
