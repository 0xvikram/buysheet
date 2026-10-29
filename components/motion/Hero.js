'use client'

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

const ease = [0.2, 0.8, 0.2, 1]

/** The headline, rising in word by word. `accent` is the word drawn in the brand colour. */
export function HeroTitle({ lines, accent }) {
  const calm = useReducedMotion()
  let i = 0
  return (
    <h1 aria-label={lines.join(' ')}>
      {lines.map((line, l) => (
        <span key={l} style={{ display: 'block' }} aria-hidden="true">
          {line.split(' ').map((w) => {
            const n = i++
            const word = w === accent ? <em>{w}</em> : w
            return (
              <span key={n} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em' }}>
                <motion.span
                  style={{ display: 'inline-block' }}
                  initial={calm ? false : { y: '105%', rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.08 + n * 0.07, ease }}
                >
                  {word}
                </motion.span>
                {' '}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

/** Fades and lifts children in after the headline. */
export function HeroIn({ children, delay = 0.5, className }) {
  const calm = useReducedMotion()
  return (
    <motion.div className={className} initial={calm ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  )
}

// One pointer position for the whole page, from -0.5 to 0.5 on each axis.
function usePointer() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  useEffect(() => {
    const move = (e) => { x.set(e.clientX / innerWidth - 0.5); y.set(e.clientY / innerHeight - 0.5) }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [x, y])
  return { x, y }
}

/** The pink and chartreuse shapes, each drifting a different way with the mouse and floating on their own. */
export function LiveShapes({ className = 'shapes', depth = 60 }) {
  const calm = useReducedMotion()
  const p = usePointer()
  const spring = { stiffness: 50, damping: 18 }
  const px = useSpring(useTransform(p.x, (v) => v * depth), spring)
  const py = useSpring(useTransform(p.y, (v) => v * depth * 0.6), spring)
  const lx = useSpring(useTransform(p.x, (v) => v * -depth * 0.8), spring)
  const ly = useSpring(useTransform(p.y, (v) => v * -depth * 0.5), spring)
  const float = (d) => (calm ? undefined : { y: [0, -14, 0], rotate: [0, d, 0] })
  return (
    <svg className={className} viewBox="0 0 1200 520" aria-hidden="true" focusable="false" style={{ overflow: 'visible' }}>
      <motion.g style={calm ? undefined : { x: px, y: py }}>
        <motion.path animate={float(-2)} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: '360px 300px' }} fill="#FF2DA8" d="M40 300 C120 180 300 220 380 140 C460 60 600 40 660 130 C720 220 640 300 700 380 C760 460 600 540 480 500 C360 460 300 520 180 500 C60 480 -20 400 40 300Z" />
      </motion.g>
      <motion.g style={calm ? undefined : { x: lx, y: ly }}>
        <motion.path animate={float(2.5)} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }} style={{ transformOrigin: '870px 300px' }} fill="#D4FF3F" d="M560 210 C640 110 820 60 940 120 C1060 180 1180 150 1180 270 C1180 390 1040 380 980 450 C920 520 760 520 700 440 C640 360 480 310 560 210Z" />
      </motion.g>
    </svg>
  )
}

/** A floating glass card that bobs gently. */
export function Float({ children, className, delay = 0 }) {
  const calm = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={calm ? false : { opacity: 0, scale: 0.9 }}
      animate={calm ? undefined : { opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{ opacity: { delay: 1 + delay, duration: 0.5 }, scale: { delay: 1 + delay, duration: 0.5 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay } }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  )
}
