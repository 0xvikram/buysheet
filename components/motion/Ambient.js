'use client'

import Lenis from 'lenis'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { useEffect } from 'react'

// Site-wide life for the marketing pages: smooth scrolling, a scroll progress line and a ripple on clicks.
// All of it switches off for "reduce motion", and the cursor is skipped on touch screens.
export default function Ambient() {
  const calm = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 })

  useEffect(() => {
    if (calm) return
    // anchors: in-page links (#how, #product…) scroll smoothly instead of being swallowed, clearing the floating nav
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: { offset: -90 } })
    window.__lenis = lenis
    let id = requestAnimationFrame(function raf(t) {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    })
    return () => { cancelAnimationFrame(id); lenis.destroy(); delete window.__lenis }
  }, [calm])

  return (
    <>
      <motion.div className="scroll-line" style={{ scaleX: progress }} aria-hidden="true" />
      {!calm && <Cursor />}
    </>
  )
}

// The normal cursor stays; a click leaves a short ripple where it landed.
function Cursor() {
  useEffect(() => {
    const click = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      const dot = document.createElement('span')
      dot.className = 'click-ripple'
      dot.style.left = `${e.clientX}px`
      dot.style.top = `${e.clientY}px`
      document.body.appendChild(dot)
      setTimeout(() => dot.remove(), 600)
    }
    addEventListener('pointerdown', click)
    return () => removeEventListener('pointerdown', click)
  }, [])
  return null
}
