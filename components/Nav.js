import Link from 'next/link'
import { BRAND } from '../lib/brand.js'
import Mark from './Mark.js'

export default function Nav({ current }) {
  return (
    <header className="nav">
      <Link href="/" className="wordmark" aria-label={`${BRAND.name} home`}>
        <Mark size={30} />
        <span>{BRAND.name}</span>
      </Link>
      <nav aria-label="Main">
        <Link href="/feed" aria-current={current === 'feed' ? 'page' : undefined}>Feed</Link>
        <Link href="/#how" aria-current={current === 'how' ? 'page' : undefined}>How it works</Link>
        <Link href="/#assistants">For AI assistants</Link>
        <Link href="/pricing" aria-current={current === 'pricing' ? 'page' : undefined}>Pricing</Link>
        <Link href="/app" className="btn lime small">Open the agent</Link>
      </nav>
    </header>
  )
}
