import Link from 'next/link'
import Icon from '../components/app/Icon.js'
import Footer from '../components/Footer.js'
import Nav from '../components/Nav.js'
import { BRAND } from '../lib/brand.js'
import { MARKET, PROOF } from '../lib/stats.js'
import { TOOLS } from '../lib/mcp.js'

const FEATURES = [
  ['drops', 'Sort any line sheet', 'Paste the brand column from any supplier or marketplace. Up to 40 brands, sorted in under a minute.'],
  ['agent', 'Every call explained', 'Taste rank, local rank and the favourite each brand links to. Ask why, and it answers from the data.'],
  ['cards', 'Review in seconds', 'Go brand by brand with the keyboard or a swipe. Overrule the agent anywhere, then export your order.'],
  ['map', 'Market map', 'See where any brand is strongest across 12 US cities before you pitch it, stock it or open near it.'],
  ['discover', 'Discover new brands', 'What else fans of your customers’ favourites love, minus the names everyone already carries.'],
  ['bolt', 'What-if, any city', 'Thinking about a second shop? Re-run the same list for another city and see what moves.'],
]

const MCP = `{
  "mcpServers": {
    "${BRAND.slug}": {
      "type": "http",
      "url": "https://<your-${BRAND.slug}-domain>/api/mcp"
    }
  }
}`

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <section className="hero">
          <div className="wrap">
            <Link href="/app/map" className="eyebrow"><b>New</b> Market map: where any brand fits across 12 US cities →</Link>
            <h1>Know what pops <em>before you buy.</em></h1>
            <p className="lead">
              {BRAND.name} is the buying agent for independent shops. Paste a supplier&apos;s brand list, and it sorts every brand
              into stock, consider or skip for your crowd, with the evidence behind each call.
            </p>
            <div className="ctas">
              <Link href="/app/new" className="btn brand lg">Start free</Link>
              <Link href="/app/explore" className="btn lg">See sample shops</Link>
            </div>
            <p className="note">Free while in beta · No card · US, UK, Europe, Japan and Australia</p>
            <div className="shot" id="product">
              <div className="bar" aria-hidden="true"><i /><i /><i /></div>
              <img className="only-light" src="/product-light.png" width="2160" height="1350" alt="A Restocked drop: 23 brands for a Denver gift shop sorted into stock, consider and skip, with taste and local ranks and the agent beside it" />
              <img className="only-dark" src="/product-dark.png" width="2160" height="1350" alt="" />
            </div>
          </div>
        </section>

        <section className="trust" aria-label="Highlights">
          <div className="wrap">
            <span>Built on <b>Qloo</b> taste data</span>
            <span>Checked against stockists in <b>12 US cities</b></span>
            <span><b>38 of 46</b> real shop brands recognised</span>
            <span>Works in <b>Claude &amp; ChatGPT</b> via MCP</span>
          </div>
        </section>

        <section className="section" id="problem">
          <div className="wrap">
            <div className="section-head">
              <p className="kicker">The problem</p>
              <h2>Every order is a bet with your cash.</h2>
              <p>Independent shops commit money to stock months ahead, on instinct and a rep&apos;s word. Sales history can&apos;t help with a brand you&apos;ve never carried, and a bestseller list knows nothing about your crowd.</p>
            </div>
            <div className="grid-4">
              {MARKET.map((s) => (
                <div key={s.big} className="card stat"><b>{s.big}</b><span>{s.line}</span><small><a href={s.href} target="_blank" rel="noreferrer">{s.source}</a></small></div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head center">
              <p className="kicker">The product</p>
              <h2>A buyer&apos;s workspace, with an agent that shows its work.</h2>
              <p>Everything a small shop needs to decide what to order, in one place.</p>
            </div>
            <div className="grid-3">
              {FEATURES.map(([icon, h, p]) => (
                <div key={h} className="card feature"><div className="ic"><Icon name={icon} /></div><h3>{h}</h3><p>{p}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap split">
            <div>
              <p className="kicker">How it works</p>
              <h2>Your crowd, not the average shopper.</h2>
              <p className="mute" style={{ fontSize: 16.5, lineHeight: 1.6 }}>
                {BRAND.name} asks Qloo two separate questions about every brand: do fans of what your customers love also love
                it, and how does it rank in your city? Taste leads; the city lifts or lowers. Anything Qloo isn&apos;t sure about is
                checked with you, never guessed.
              </p>
            </div>
            <ol className="card" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[['Set up your shop once', 'Where it is, and the brands, musicians or shows your regulars love.'], ['Paste a supplier list', 'Any line sheet. Unclear names are confirmed with you.'], ['Get your drop', 'Stock, consider, skip, with reasons. Review, ask follow-ups, export.']].map(([h, p], i) => (
                <li key={h} style={{ display: 'flex', gap: 14, padding: '18px 20px', borderBottom: i < 2 ? '1px solid var(--line-2)' : 0 }}>
                  <span className="logo-sq" style={{ background: 'var(--text)', color: 'var(--bg)', borderColor: 'var(--text)' }}>{i + 1}</span>
                  <div><b>{h}</b><p className="mute" style={{ margin: '2px 0 0' }}>{p}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" id="proof">
          <div className="wrap">
            <div className="section-head">
              <p className="kicker">Why trust it</p>
              <h2>We checked it against reality.</h2>
              <p>Before building, we compared Qloo&apos;s city rankings with where brands are actually stocked. Then we made the agent show every call it makes.</p>
            </div>
            <div className="grid-3">
              {PROOF.map((s) => <div key={s.big} className="card stat"><b>{s.big}</b><span>{s.line}</span><small>{s.source}</small></div>)}
            </div>
          </div>
        </section>

        <section className="section" id="assistants">
          <div className="wrap split">
            <div>
              <p className="kicker">For AI assistants</p>
              <h2>Already live in your AI.</h2>
              <p className="mute" style={{ fontSize: 16.5, lineHeight: 1.6, marginBottom: 20 }}>{BRAND.name} is an MCP server. Add one line to Claude or ChatGPT and your assistant gets the same tools and the same data.</p>
              <ul className="ticks">{TOOLS.map((t) => <li key={t.name}><b className="mono" style={{ fontSize: 13 }}>{t.name}</b> · {t.title}</li>)}</ul>
            </div>
            <pre className="code" aria-label="MCP configuration">{MCP}</pre>
          </div>
        </section>

        <section className="wrap">
          <div className="cta-band">
            <div><h2>Your next order, sorted.</h2><p>Free while in beta. Set up your shop in a minute.</p></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/app/new" className="btn brand lg">Start free</Link>
              <Link href="/pricing" className="btn lg" style={{ background: 'transparent', color: '#eceef3', borderColor: '#2c2f3d' }}>See pricing</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
