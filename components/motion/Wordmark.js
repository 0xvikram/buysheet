'use client'

import { useRef } from 'react'

/** A giant outlined wordmark; pink and chartreuse paint fill it wherever the cursor goes. */
export default function Wordmark({ text }) {
  const ref = useRef(null)
  return (
    <div
      ref={ref}
      className="wordmark-xl"
      aria-hidden="true"
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        ref.current.style.setProperty('--wx', `${((e.clientX - r.left) / r.width) * 100}%`)
        ref.current.style.setProperty('--wy', `${((e.clientY - r.top) / r.height) * 100}%`)
        ref.current.style.setProperty('--wr', `${Math.round(r.height * 1.1)}px`)
      }}
      onPointerLeave={() => ref.current.style.setProperty('--wr', '0px')}
    >
      <span className="outline">{text}</span>
      <span className="paint">{text}</span>
    </div>
  )
}
