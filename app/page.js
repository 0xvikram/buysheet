import Link from 'next/link'
import Icon from '../components/app/Icon.js'
import Footer from '../components/Footer.js'
import CountUp from '../components/motion/CountUp.js'
import { Float, HeroIn, HeroTitle, LiveShapes } from '../components/motion/Hero.js'
import Magnetic from '../components/motion/Magnetic.js'
import Reveal from '../components/motion/Reveal.js'
import SortDemo from '../components/motion/SortDemo.js'
import Spotlight from '../components/motion/Spotlight.js'
import Tilt from '../components/motion/Tilt.js'
import TypeCode from '../components/motion/TypeCode.js'
import Nav from '../components/Nav.js'
import { BRAND } from '../lib/brand.js'
import { TOOLS } from '../lib/mcp.js'
import { MARKET, PROOF } from '../lib/stats.js'
import denver from '../public/examples/denver.json'

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

// The real Denver drop, for the live demo and the marquee.
const drop = denver.turns.flatMap((t) => t.replies).find((r) => r.type === 'drop').drop
const pick = (g) => drop.sheet.rows.filter((r) => r.group === g).slice(0, 3)
const DEMO = [0, 1, 2].flatMap((i) => [pick('stock')[i], pick('skip')[i], pick('consider')[i]]).filter(Boolean).map(({ name, group }) => ({ name, group }))
const TICKER = [
  'Built on Qloo taste data', ...drop.sheet.rows.filter((r) => r.group === 'stock').map((r) => `${r.name} · stock`),
  'Checked against stockists in 12 US cities', ...drop.sheet.rows.filter((r) => r.group === 'skip').map((r) => `${r.name} · skip`),
  '38 of 46 shop brands recognised', 'Works in Claude & ChatGPT via MCP',
]

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <section className="hero">
          <div className="wrap">
            <HeroIn delay={0}>
              <Link href="/app/map" className="eyebrow glass"><b>New</b> Market map: where any brand fits across 12 US cities →</Link>
            </HeroIn>
            <HeroTitle lines={['Know what pops', 'before you buy.']} accent="pops" />
            <HeroIn delay={0.55}>
              <p className="lead">
                {BRAND.name} is the buying agent for independent shops. Paste a supplier&apos;s brand list, and it sorts every brand
                into stock, consider or skip for your crowd, with the evidence behind each call.
              </p>
              <div className="ctas">
                <Magnetic><Link href="/app/new" className="btn primary lg">Start free →</Link></Magnetic>
                <Magnetic><Link href="/app/explore" className="btn glass lg">See sample shops</Link></Magnetic>
              </div>
              <p className="note">Free while in beta · No card · US, UK, Europe, Japan and Australia</p>
            </HeroIn>
            <HeroIn delay={0.75} className="stage">
              <span id="product" style={{ position: 'absolute', top: -80 }} />
              <LiveShapes />
              <Tilt className="shot glass" max={4}>
                <div className="bar" aria-hidden="true"><i /><i /><i /></div>
                <img className="only-light" src="/product-light.png" width="2160" height="1350" alt="A Restocked drop: 23 brands for a Denver gift shop sorted into stock, consider and skip, with taste and local ranks and the agent beside it" />
                <img className="only-dark" src="/product-dark.png" width="2160" height="1350" alt="" />
              </Tilt>
              <Float className="float glass f1"><b>Stanley → Stock</b>1st of 23 for Patagonia fans.<br /><i className="pk">⇄ bestseller list says skip</i></Float>
              <Float className="float glass f2" delay={1.4}><b>Filson fits Seattle</b>#1 of 12 US cities on Qloo.<br /><i className="lm">Market map</i></Float>
            </HeroIn>
          </div>
        </section>

        <section className="trust" aria-label="Highlights">
          <div className="marquee">
            <div className="marquee-track">
              {[...TICKER, ...TICKER].map((t, i) => <span key={i} aria-hidden={i >= TICKER.length ? true : undefined}>{t}<i className="sep" /></span>)}
            </div>
          </div>
        </section>

        <section className="section" id="problem">
          <div className="wrap">
            <Reveal className="section-head">
              <p className="kicker">The problem</p>
              <h2>Every order is a bet with your cash.</h2>
              <p>Independent shops commit money to stock months ahead, on instinct and a rep&apos;s word. Sales history can&apos;t help with a brand you&apos;ve never carried, and a bestseller list knows nothing about your crowd.</p>
            </Reveal>
            <Spotlight className="grid-4">
              {MARKET.map((s, i) => (
                <Reveal key={s.big} delay={i * 0.08} className="card stat glass spot">
                  <b><CountUp value={s.big} /></b><span>{s.line}</span><small><a href={s.href} target="_blank" rel="noreferrer">{s.source}</a></small>
                </Reveal>
              ))}
            </Spotlight>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <Reveal className="section-head center">
              <p className="kicker">The product</p>
              <h2>A buyer&apos;s workspace, with an agent that shows its work.</h2>
              <p>Everything a small shop needs to decide what to order, in one place.</p>
            </Reveal>
            <Spotlight className="grid-3">
              {FEATURES.map(([icon, h, p], i) => (
                <Reveal key={h} delay={(i % 3) * 0.08} className="card feature glass spot">
                  <div className="ic"><Icon name={icon} /></div><h3>{h}</h3><p>{p}</p>
                </Reveal>
              ))}
            </Spotlight>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <Reveal className="section-head">
              <p className="kicker">How it works</p>
              <h2>Your crowd, not the average shopper.</h2>
              <p>
                {BRAND.name} asks Qloo two separate questions about every brand: do fans of what your customers love also love it, and
                how does it rank in your city? Taste leads; the city lifts or lowers. Anything Qloo isn&apos;t sure about is checked with
                you, never guessed. Here it is sorting a real list:
              </p>
            </Reveal>
            <Reveal><SortDemo rows={DEMO} /></Reveal>
            <div className="steps-row">
              {[['Set up your shop once', 'Where it is, and the brands, musicians or shows your regulars love.'], ['Paste a supplier list', 'Any line sheet. Unclear names are confirmed with you.'], ['Get your drop', 'Stock, consider, skip, with reasons. Review, ask follow-ups, export.']].map(([h, p], i) => (
                <Reveal key={h} delay={i * 0.1} className="step-item">
                  <span className="step-n">{String(i + 1).padStart(2, '0')}</span><b>{h}</b><p>{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="proof">
          <div className="wrap">
            <Reveal className="section-head">
              <p className="kicker">Why trust it</p>
              <h2>We checked it against reality.</h2>
              <p>Before building, we compared Qloo&apos;s city rankings with where brands are actually stocked. Then we made the agent show every call it makes.</p>
            </Reveal>
            <Spotlight className="grid-3">
              {PROOF.map((s, i) => (
                <Reveal key={s.big} delay={i * 0.08} className="card stat glass spot"><b><CountUp value={s.big} /></b><span>{s.line}</span><small>{s.source}</small></Reveal>
              ))}
            </Spotlight>
          </div>
        </section>

        <section className="section" id="assistants">
          <div className="wrap split">
            <Reveal>
              <p className="kicker">For AI assistants</p>
              <h2>Already live in your AI.</h2>
              <p className="mute" style={{ fontSize: 16.5, lineHeight: 1.6, marginBottom: 20 }}>{BRAND.name} is an MCP server. Add one line to Claude or ChatGPT and your assistant gets the same tools and the same data.</p>
              <ul className="ticks">{TOOLS.map((t) => <li key={t.name}><b className="mono" style={{ fontSize: 13 }}>{t.name}</b> · {t.title}</li>)}</ul>
            </Reveal>
            <Reveal delay={0.1}><TypeCode code={MCP} label="MCP configuration" /></Reveal>
          </div>
        </section>

        <section className="wrap">
          <Reveal className="cta-band">
            <LiveShapes className="shapes" depth={40} />
            <div><h2>Your next order, sorted.</h2><p>Free while in beta. Set up your shop in a minute.</p></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
              <Magnetic><Link href="/app/new" className="btn brand lg">Start free</Link></Magnetic>
              <Magnetic><Link href="/pricing" className="btn lg" style={{ background: 'rgba(11,11,11,.55)', color: '#f5f5f2', borderColor: 'rgba(255,255,255,.2)', backdropFilter: 'blur(12px)' }}>See pricing</Link></Magnetic>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  )
}
