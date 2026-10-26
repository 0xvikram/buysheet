'use client'

import Lenis from 'lenis'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// Site-wide life for the marketing pages: smooth scrolling, a scroll progress line and a cursor ring.
// All of it switches off for "reduce motion", and the cursor is skipped on touch screens.
export default function Ambient() {
  const calm = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })

  useEffect(() => {
    if (calm) return
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true })
    let id = requestAnimationFrame(function raf(t) {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    })
    return () => { cancelAnimationFrame(id); lenis.destroy() }
  }, [calm])

  return (
    <>
      <motion.div className="scroll-line" style={{ scaleX: progress }} aria-hidden="true" />
      {!calm && <Cursor />}
    </>
  )
}

function Cursor() {
  const ring = useRef(null)
  const dot = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    setOn(true)
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, big = false, id
    const move = (e) => {
      x = e.clientX; y = e.clientY
      big = !!e.target.closest?.('a, button, [data-cursor], input, textarea, select, label')
    }
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${big ? 1.9 : 1})`
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      id = requestAnimationFrame(tick)
    }
    addEventListener('pointermove', move)
    id = requestAnimationFrame(tick)
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(id) }
  }, [])
  if (!on) return null
  return <><div className="cursor-ring" ref={ring} aria-hidden="true" /><div className="cursor-dot" ref={dot} aria-hidden="true" /></>
}
