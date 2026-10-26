import Footer from '../../components/Footer.js'
import Nav from '../../components/Nav.js'
import Plans from '../../components/Plans.js'
import { BRAND } from '../../lib/brand.js'

export const metadata = { title: 'Pricing', description: `${BRAND.name} plans for independent shops, multi-store owners and brands.` }

// Measured from recorded runs of the agent against Qloo's API (public/examples, Oct 2026).
const COSTS = [
  ['Sort a 23-brand supplier list', '28', 'One lookup per name and favourite, then two rankings'],
  ['Market map for one brand', '12', 'One local reading per city, asked one at a time'],
  ['What-if for another city', '1–2', 'Re-ranks the list you already have'],
  ['Compare two brands', '2–4', 'Audience and traits for each'],
  ['Discover new brands', '1–6', 'Looks up your favourites, then one search'],
  ['Ask why a brand landed where it did', '0', 'Answered from data already fetched'],
]

const FAQ = [
  ['Is it really free right now?', `Yes. ${BRAND.name} is in beta and every feature is free. The plans above are what we expect to charge once accounts launch.`],
  ['Why charge shops at all?', 'Every drop runs on licensed taste data from Qloo’s API, and a single drop makes around 28 calls. The free plan covers a real order a month; paid plans cover shops that buy every week.'],
  ['What does Qloo cost?', 'Qloo prices its commercial API by contract and doesn’t publish rates. Our plans are set so a shop never pays per call: the call budget is built into each plan.'],
  ['Is my shop’s data shared with brands?', 'No. Brands will only ever see aggregate demand across many shops, never one shop’s lists, calls or orders.'],
]

export default function Pricing() {
  return (
    <>
      <Nav current="pricing" />
      <main>
        <section className="section" style={{ paddingBottom: 48 }}>
          <div className="wrap">
            <div className="section-head center">
              <p className="kicker">Pricing</p>
              <h2>Simple plans. Free while in beta.</h2>
              <p>Start free. Upgrade when {BRAND.name} is part of every order. Brands pay to see where they fit, so shops never pay for that.</p>
            </div>
            <Plans />
          </div>
        </section>

        <section className="section">
          <div className="wrap split" style={{ alignItems: 'start' }}>
            <div>
              <p className="kicker">What a plan pays for</p>
              <h2>Real data, counted call by call.</h2>
              <p className="mute" style={{ fontSize: 16, lineHeight: 1.6 }}>
                Each drop is built from live calls to Qloo&apos;s taste API. Here is what each action uses, measured from real runs. Plans
                include the calls, so you never see a meter.
              </p>
            </div>
            <div className="table-wrap">
              <table className="cost-table">
                <thead><tr><th>Action</th><th>Qloo calls</th><th>Why</th></tr></thead>
                <tbody>{COSTS.map(([a, n, w]) => <tr key={a}><td>{a}</td><td className="num">{n}</td><td className="mute">{w}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="section-head"><p className="kicker">Questions</p><h2>Good to know</h2></div>
            <div className="faq">{FAQ.map(([q, a]) => <div key={q} className="card"><h3>{q}</h3><p>{a}</p></div>)}</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
