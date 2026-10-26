import Link from 'next/link'
import Footer from '../../components/Footer.js'
import Nav from '../../components/Nav.js'
import { BRAND } from '../../lib/brand.js'

export const metadata = { title: 'Pricing' }

export default function Pricing() {
  return (
    <>
      <Nav current="pricing" />
      <main className="wrap section" style={{ borderTop: 0, paddingTop: 30 }}>
        <p className="kicker">Pricing</p>
        <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', margin: '10px 0 14px' }}>
          Free for shops. <span className="lime">Always.</span>
        </h1>
        <p className="lead mute" style={{ maxWidth: '60ch' }}>
          Shops get the buying agent for free. Brands will pay to see where their brand fits: which cities and crowds want it,
          built from what shops look up.
        </p>
        <div className="plans">
          <div className="plan hot">
            <h3>Shop</h3>
            <div className="price">$0 <small>/ month</small></div>
            <ul className="tick">
              <li>Unlimited drops during the beta</li>
              <li>Ask why, what-if, compare and discover</li>
              <li>Every call shown with its evidence</li>
              <li>Use it from your own AI assistant</li>
            </ul>
            <Link href="/app" className="btn">Start a drop</Link>
          </div>
          <div className="plan">
            <h3>Brand</h3>
            <div className="price">Soon</div>
            <ul className="tick">
              <li>See which cities and crowds fit your brand</li>
              <li>Find the shops whose customers already love brands like yours</li>
              <li>Aggregate demand only. No shop&apos;s private details, ever</li>
            </ul>
            <span className="btn" aria-disabled="true" style={{ opacity: 0.7, cursor: 'default' }}>Waitlist opens with accounts</span>
          </div>
        </div>
        <p className="mute" style={{ fontSize: '0.86rem', marginTop: 24 }}>
          {BRAND.name} is in beta and built for the Qloo Agentic Hackathon. Brand pricing will be set with the first brands on the waitlist.
        </p>
      </main>
      <Footer />
    </>
  )
}
