'use client'

// Gives every `.spot` inside it a glow and border light that follow the cursor (CSS does the drawing).
export default function Spotlight({ children, className, as: Tag = 'div' }) {
  return (
    <Tag
      className={className}
      onPointerMove={(e) => {
        for (const el of e.currentTarget.querySelectorAll('.spot')) {
          const r = el.getBoundingClientRect()
          el.style.setProperty('--mx', `${e.clientX - r.left}px`)
          el.style.setProperty('--my', `${e.clientY - r.top}px`)
        }
      }}
    >
      {children}
    </Tag>
  )
}
