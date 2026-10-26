'use client'

import Link from 'next/link'
import { useState } from 'react'
import CountUp from './motion/CountUp.js'
import Spotlight from './motion/Spotlight.js'

// Proposed plans. Billing isn't live: everything is free during the beta.
const PLANS = [
  { name: 'Starter', for: 'Try it on your next order.', monthly: 0, yearly: 0, cta: 'Start free', href: '/app/new', items: ['3 drops a month', 'Up to 25 brands per drop', '3 market maps a month', 'Ask the agent anything', 'CSV export'] },
  { name: 'Shop', for: 'For one shop buying every season.', monthly: 29, yearly: 23, cta: 'Start free, upgrade later', href: '/app/new', featured: true, items: ['Unlimited drops, 40 brands each', '50 market maps a month', 'Discover new brands', 'What-if for any city', 'Share links and review', 'Use it from Claude or ChatGPT (MCP)'] },
  { name: 'Multi-store', for: 'For owners with more than one location.', monthly: 79, yearly: 63, cta: 'Start free', href: '/app/new', items: ['Everything in Shop', 'Up to 5 locations', '3 team seats', '200 market maps a month', 'Compare locations side by side'] },
  { name: 'Brand', for: 'For brands choosing where to sell.', monthly: 249, yearly: 199, cta: 'Opens with accounts', href: null, soon: true, items: ['Where your brand fits, by city', 'Which shop crowds match yours', 'Unlimited market maps', 'Aggregate demand only. No shop’s data, ever'] },
]

export default function Plans() {
  const [yearly, setYearly] = useState(true)
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <div className="billing" role="group" aria-label="Billing period">
          <button aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
          <button aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly · save 20%</button>
        </div>
      </div>
      <Spotlight className="plans">
        {PLANS.map((p) => (
          <div key={p.name} className={`card plan spot${p.featured ? ' featured' : ''}`}>
            {p.featured && <span className="badge new tag">Most shops</span>}
            {p.soon && <span className="badge plain tag">Coming soon</span>}
            <h3>{p.name}</h3>
            <p className="for">{p.for}</p>
            <div className="price">$<CountUp value={yearly ? p.yearly : p.monthly} duration={0.8} /><small> / month{p.monthly && yearly ? ', billed yearly' : ''}</small></div>
            <ul className="ticks">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
            {p.href ? <Link href={p.href} className={`btn${p.featured ? ' primary' : ''}`}>{p.cta}</Link> : <span className="btn" aria-disabled="true" style={{ opacity: 0.6, cursor: 'default', marginTop: 'auto' }}>{p.cta}</span>}
          </div>
        ))}
      </Spotlight>
    </>
  )
}
