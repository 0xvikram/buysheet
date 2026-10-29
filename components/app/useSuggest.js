'use client'

import { useEffect, useRef, useState } from 'react'

/** Suggestions from /api/suggest for what is being typed: waits until typing pauses, ignores stale answers. */
export function useSuggest(kind, query, { min = 2, wait = 300 } = {}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const seq = useRef(0)
  useEffect(() => {
    const q = query.trim()
    if (q.length < min) { setOptions([]); setLoading(false); return }
    const n = ++seq.current
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?kind=${kind}&q=${encodeURIComponent(q)}`)
        const d = await r.json()
        if (n === seq.current) setOptions(d.options || [])
      } catch {
        if (n === seq.current) setOptions([])
      } finally {
        if (n === seq.current) setLoading(false)
      }
    }, wait)
    return () => clearTimeout(t)
  }, [kind, query, min, wait])
  return { options, loading }
}

/** Keyboard movement through a suggestion list. */
export function useActive(count) {
  const [active, setActive] = useState(0)
  const ref = useRef(0)
  const set = (v) => { ref.current = v; setActive(v) }
  useEffect(() => set(0), [count])
  return { active, ref, set, move: (d) => count && set((ref.current + d + count) % count) }
}
