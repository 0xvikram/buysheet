'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// The 48-second guided demo in the hero frame. It only downloads once the frame is near the screen,
// plays muted on a loop while visible, and pauses when scrolled away. Reduced motion: it waits for a click.
export default function DemoVideo() {
  const ref = useRef(null)
  const calm = useReducedMotion()
  const [src, setSrc] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const userPaused = useRef(false)
  const visible = useRef(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting
      if (e.isIntersecting) {
        setSrc('/demo.mp4')
        if (v.currentSrc && !calm && !userPaused.current) v.play().catch(() => {})
      } else v.pause()
    }, { rootMargin: '200px 0px', threshold: 0.25 })
    io.observe(v)
    return () => io.disconnect()
  }, [calm])

  // once the file is attached, start playing if the frame is on screen
  useEffect(() => {
    const v = ref.current
    if (src && v && visible.current && !calm && !userPaused.current) v.play().catch(() => {})
  }, [src, calm])

  const toggle = () => {
    const v = ref.current
    if (v.paused) { userPaused.current = false; setSrc('/demo.mp4'); v.play().catch(() => {}) }
    else { userPaused.current = true; v.pause() }
  }

  return (
    <div className="demo-video">
      <video
        ref={ref}
        src={src || undefined}
        poster="/demo-poster.jpg"
        muted
        loop
        playsInline
        preload="none"
        width="1280"
        height="800"
        aria-label="A 48-second guided demo: pasting a supplier list, the sorted drop with reasons, a bestseller-list flip, review, the order draft, the market map and asking the agent"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onClick={toggle}
      />
      <button type="button" className="dv-btn glass" onClick={toggle} aria-label={playing ? 'Pause the demo' : 'Play the demo'}>
        {playing ? <svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" /></svg> : <svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>}
        <span>{playing ? 'Guided demo · 48 s' : 'Play the 48-second demo'}</span>
      </button>
      <div className="dv-progress" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
    </div>
  )
}
