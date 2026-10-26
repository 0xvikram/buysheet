'use client'

import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/** A code block that types itself out when it comes into view, with a copy button. */
export default function TypeCode({ code, label }) {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, margin: '-80px' })
  const calm = useReducedMotion()
  const [n, setN] = useState(calm ? code.length : 0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (calm || !seen || n >= code.length) return
    const t = setTimeout(() => setN((v) => Math.min(code.length, v + 3)), 16)
    return () => clearTimeout(t)
  }, [n, seen, calm, code.length])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="typecode" ref={ref}>
      <button className="btn sm copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      <pre className="code" aria-label={label}>{code.slice(0, n)}<span className={`caret${n >= code.length ? ' idle' : ''}`} aria-hidden="true" /></pre>
    </div>
  )
}
