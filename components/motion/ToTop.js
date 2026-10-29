'use client'

/** Back to the top of the page, smoothly when smooth scrolling is on. */
export default function ToTop() {
  const up = () => (window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }))
  return <button type="button" className="btn sm to-top" onClick={up} aria-label="Back to top">↑ Top</button>
}
