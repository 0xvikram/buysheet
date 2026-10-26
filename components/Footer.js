import Link from 'next/link'
import { BRAND } from '../lib/brand.js'
import Mark from './Mark.js'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      ['Buying agent', '/app'],
      ['How it works', '/#how'],
      ['Pricing', '/pricing'],
      ['See a real example', '/app?example=denver'],
    ],
  },
  {
    title: 'For builders',
    links: [
      ['Use it from your AI assistant', '/#assistants'],
      ['MCP endpoint', '/#assistants'],
      ['Why trust it', '/#proof'],
    ],
  },
  {
    title: 'Who it’s for',
    links: [
      ['Gift & lifestyle shops', '/app?example=denver'],
      ['Apothecaries & beauty', '/app?example=brooklyn'],
      ['Brands (coming soon)', '/pricing'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="wordmark" aria-label={`${BRAND.name} home`}>
            <Mark size={30} />
            <span>{BRAND.name}</span>
          </Link>
          <p>{BRAND.pitch}</p>
          <Link href="/app" className="btn lime small">Start a drop, free</Link>
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
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {BRAND.name}. Built on Qloo’s taste data for the Qloo Agentic Hackathon.</p>
        <p>Rankings describe what groups of people tend to like. They are not sales forecasts, and say nothing about any one person.</p>
      </div>
    </footer>
  )
}
