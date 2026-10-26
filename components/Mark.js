// Restocked's mark: a retail hang tag with a tick, for "approved for stock".
// `tone`: 'auto' follows the theme (ink on light, lime on dark); 'lime' and 'ink' are fixed.
const TONES = {
  auto: ['var(--mark-fill)', 'var(--mark-cut)'],
  lime: ['#d9ff3a', '#11121c'],
  ink: ['#11121c', '#d9ff3a'],
}

export default function Mark({ size = 28, tone = 'auto', title }) {
  const [fill, cut] = TONES[tone] ?? TONES.auto
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g transform="rotate(-14 24 24)">
        <path d="M15 8h23a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H15L4.6 25.7a3 3 0 0 1 0-3.4z" style={{ fill }} />
        <circle cx="13.5" cy="24" r="3" style={{ fill: cut }} />
        <path d="M22 24.5l5 5 10-11" fill="none" style={{ stroke: cut }} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
