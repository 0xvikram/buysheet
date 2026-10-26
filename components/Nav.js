import Link from 'next/link'
import { BRAND } from '../lib/brand.js'
import Mark from './Mark.js'
import ThemeToggle from './ThemeToggle.js'

export default function Nav({ current }) {
  const link = (href, label, id) => <Link href={href} aria-current={current === id ? 'page' : undefined}>{label}</Link>
  return (
    <header className="site-nav">
      <div className="wrap">
        <Link href="/" className="wordmark" aria-label={`${BRAND.name} home`}><Mark size={26} />{BRAND.name}</Link>
        <nav aria-label="Main">
          {link('/#product', 'Product', 'product')}
          {link('/#how', 'How it works', 'how')}
          {link('/app/explore', 'Sample shops', 'explore')}
          {link('/#assistants', 'For AI assistants', 'ai')}
          {link('/pricing', 'Pricing', 'pricing')}
        </nav>
        <div className="right">
          <ThemeToggle />
          <Link href="/app" className="btn">Open app</Link>
          <Link href="/app/new" className="btn primary">Start free</Link>
        </div>
      </div>
    </header>
  )
}
