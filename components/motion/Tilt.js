'use client'

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

/** Tilts towards the cursor in 3D. */
export default function Tilt({ children, max = 6, className, style }) {
  const calm = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 120, damping: 18 })
  return (
    <motion.div
      className={className}
      style={{ ...style, rotateX: calm ? 0 : rx, rotateY: calm ? 0 : ry, transformPerspective: 1400 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width)
        py.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5) }}
    >
      {children}
    </motion.div>
  )
}
