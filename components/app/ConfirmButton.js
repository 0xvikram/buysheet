'use client'

import { useEffect, useState } from 'react'

/** A button that asks for a second click instead of a browser dialog. */
export default function ConfirmButton({ children, confirm = 'Click again to confirm', onConfirm, className = 'btn sm' }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" className={className} onClick={() => (armed ? onConfirm() : setArmed(true))} style={armed ? { borderColor: 'var(--skip-dot)', color: 'var(--skip)' } : undefined}>
      {armed ? confirm : children}
    </button>
  )
}
