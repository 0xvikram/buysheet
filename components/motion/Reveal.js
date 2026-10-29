'use client'

import { motion, useReducedMotion } from 'motion/react'

/** Rises into place the first time it scrolls into view. `as` picks the element. */
export default function Reveal({ children, delay = 0, y = 24, as = 'div', className, style, ...rest }) {
  const calm = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      style={style}
      initial={calm ? false : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
