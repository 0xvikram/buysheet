import Link from 'next/link'
import { BRAND } from '../lib/brand.js'
import Mark from './Mark.js'
import Magnetic from './motion/Magnetic.js'
import Wordmark from './motion/Wordmark.js'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      ['Workspace', '/app'],
      ['Market map', '/app/map'],
      ['Pricing', '/pricing'],
      ['Sample shops', '/app/explore'],
    ],
  },
  {
    title: 'For builders',
    links: [
      ['Connect your AI assistant', '/app/connect'],
      ['MCP endpoint', '/#assistants'],
      ['Why trust it', '/#proof'],
    ],
  },
  {
    title: 'Who it’s for',
    links: [
      ['Gift & lifestyle shops', '/app/explore/denver'],
      ['Beauty & apothecary', '/app/explore/losangeles'],
      ['Brands', '/pricing'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="wordmark" aria-label={`${BRAND.name} home`}>
            <Mark size={26} />
            {BRAND.name}
          </Link>
          <p>{BRAND.pitch}</p>
          <Link href="/app/new" className="btn primary">Start free</Link>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="footer-col">
            <h2>{c.title}</h2>
            <ul>
              {c.links.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="footer-xl">
        <Wordmark text={BRAND.name} />
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {BRAND.name}. Built on Qloo’s taste data for the Qloo Agentic Hackathon.</p>
        <p>Rankings describe what groups of people tend to like. They are not sales forecasts, and say nothing about any one person.</p>
        <Magnetic><a href="#top" className="btn sm to-top" aria-label="Back to top">↑ Top</a></Magnetic>
      </div>
    </footer>
  )
}
