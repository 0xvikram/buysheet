'use client'

import { useInView } from 'motion/react'
import { useRef } from 'react'

// A tiny picture of the number, drawn from the same figure: a split bar, a strip of days, a share bar or a row of dots.
// It fills in the first time it is seen.
export default function StatViz({ viz }) {
  const ref = useRef(null)
  const on = useInView(ref, { once: true, margin: '-40px' })
  if (!viz) return null
  const cls = `viz viz-${viz.type}${on ? ' on' : ''}`
  if (viz.type === 'split') {
    const share = (viz.part / viz.total) * 100
    return (
      <div ref={ref} className={cls} aria-hidden="true">
        <div className="viz-bar"><i style={{ '--w': `${share}%` }} /></div>
        <div className="viz-legend"><span><em className="k part" />{viz.partLabel}</span><span><em className="k rest" />{viz.restLabel}</span></div>
      </div>
    )
  }
  if (viz.type === 'days') {
    return (
      <div ref={ref} className={cls} aria-hidden="true">
        <div className="viz-days">{Array.from({ length: viz.of }, (_, i) => <i key={i} className={i < viz.filled ? 'f' : ''} style={{ '--d': `${i * 22}ms` }} />)}</div>
        <div className="viz-legend"><span>{viz.filled} days of cash</span><span>a {viz.of}-day month</span></div>
      </div>
    )
  }
  if (viz.type === 'share') {
    return (
      <div ref={ref} className={cls} aria-hidden="true">
        <div className="viz-bar"><i style={{ '--w': `${viz.value}%` }} /></div>
        <div className="viz-legend"><span>{viz.label}</span><span>{viz.value}%</span></div>
      </div>
    )
  }
  if (viz.type === 'dots') {
    return (
      <div ref={ref} className={cls} aria-hidden="true">
        <div className="viz-dots">{Array.from({ length: viz.of }, (_, i) => <i key={i} className={i < viz.lit ? 'f' : ''} style={{ '--d': `${i * 40}ms` }} />)}</div>
      </div>
    )
  }
  return null
}
