'use client'

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

/** Pulls its child gently towards the cursor while hovered. */
export default function Magnetic({ children, strength = 0.3, className }) {
  const calm = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 })
  return (
    <motion.span
      className={className}
      style={{ display: 'inline-flex', x, y }}
      onPointerMove={(e) => {
        if (calm || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.span>
  )
}
