import Link from 'next/link'
import DropCard from '../components/DropCard.js'
import Footer from '../components/Footer.js'
import Nav from '../components/Nav.js'
import { BRAND } from '../lib/brand.js'
import { MARKET, PROOF } from '../lib/stats.js'
import denver from '../public/examples/denver.json'

const drop = denver.turns.flatMap((t) => t.replies).find((r) => r.type === 'drop').drop

const ASKS = ['Why skip Baggu?', 'What if I opened in Austin?', 'Who buys Topo Designs?', 'Snow Peak vs Cotopaxi', 'Find me new brands for my crowd', 'Add Danner to my list']

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
        <section className="wrap hero">
          <div>
            <span className="badge"><b>#01</b> The buying agent for independent shops</span>
            <h1 className="display">Know what pops <span>before you buy.</span></h1>
            <p className="lead">
              Paste a supplier&apos;s brand list. Tell {BRAND.name} where your shop is and what your customers already love.
              Get every brand sorted into <b className="lime">stock</b>, consider or skip, with the evidence. Before the
              cash leaves your account.
            </p>
            <div className="ctas">
              <Link href="/app" className="btn lime">Start a drop, free</Link>
              <Link href="/app?example=denver" className="btn">See a real example</Link>
            </div>
            <p className="note">No card. Works for shops in the US, UK, Europe, Japan and Australia.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <DropCard drop={drop} interactive={false} limit={4} />
            <p className="mute mono" style={{ fontSize: '0.75rem', marginTop: 12 }}>
              Real output: a Denver gift shop whose customers love {drop.loves.join(', ')}.
            </p>
          </div>
        </section>

        <section className="section" id="problem">
          <div className="wrap">
            <p className="kicker">The problem</p>
            <h2 className="display">Buying is a <span className="lime">bet</span>.</h2>
            <p className="lead">
              Independent shops commit their cash to stock months ahead, usually on instinct and a sales rep&apos;s word. Your
              sales history can&apos;t help with a brand you&apos;ve never carried. Get it wrong and the money sits on a shelf
              until the markdown.
            </p>
            <div className="stats">
              {MARKET.map((s) => (
                <div key={s.big} className="stat">
                  <b>{s.big}</b><span>{s.line}</span>
                  <small><a href={s.href} target="_blank" rel="noreferrer">{s.source}</a></small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <p className="kicker">How it works</p>
            <h2 className="display">Three steps. <span className="lime">One drop.</span></h2>
            <div className="steps">
              <div className="step"><div className="num">01</div><h3>Tell it your crowd</h3><p>Where your shop is, and the brands, musicians or shows your regulars already love.</p></div>
              <div className="step"><div className="num">02</div><h3>Paste the line sheet</h3><p>Any supplier or marketplace list. It checks every name and asks when one is unclear.</p></div>
              <div className="step"><div className="num">03</div><h3>Get your drop</h3><p>Stock, consider, skip. Every call comes with its reasons, and you can ask follow-ups.</p></div>
            </div>
            <div className="asks" aria-label="Things you can ask">
              {ASKS.map((a) => <Link key={a} href={`/app?ask=${encodeURIComponent(a)}`} className="chip">{a}</Link>)}
            </div>
          </div>
        </section>

        <section className="section" id="proof">
          <div className="wrap">
            <p className="kicker">Why trust it</p>
            <h2 className="display">We checked it <span className="lime">against reality.</span></h2>
            <p className="lead">
              {BRAND.name} reads cultural taste data from Qloo: what fans of one brand, artist or show also love, and how brands
              rank city by city. Then it shows its work, every time.
            </p>
            <div className="stats">
              {PROOF.map((s) => (
                <div key={s.big} className="stat"><b>{s.big}</b><span>{s.line}</span><small>{s.source}</small></div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="assistants">
          <div className="wrap">
            <p className="kicker">For AI assistants</p>
            <h2 className="display">Already have <span className="lime">an assistant?</span></h2>
            <div className="split">
              <div>
                <p className="lead" style={{ marginTop: 0 }}>
                  {BRAND.name}&apos;s tools are open to any assistant that speaks MCP, such as Claude or ChatGPT. Your assistant
                  does the talking; {BRAND.name} brings the taste data.
                </p>
                <ul className="tick">
                  <li><b>sort_brand_list</b>: stock, consider or skip for one shop</li>
                  <li><b>find_similar_brands</b>: what this crowd also loves</li>
                  <li><b>describe_audience</b>: who buys a brand</li>
                  <li><b>compare_brands</b>: two brands side by side</li>
                </ul>
              </div>
              <pre className="code" aria-label="MCP configuration">{MCP}</pre>
            </div>
          </div>
        </section>

        <section className="wrap">
          <div className="cta-band">
            <h2 className="display">Your next order, <br />sorted.</h2>
            <Link href="/app" className="btn">Open the agent</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
