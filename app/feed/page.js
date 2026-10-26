import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import DropCard from '../../components/DropCard.js'
import Footer from '../../components/Footer.js'
import Nav from '../../components/Nav.js'
import { BRAND } from '../../lib/brand.js'
import { list } from '../../lib/words.js'
import { encodeDrop } from '../../lib/share.js'

export const metadata = {
  title: 'Feed',
  description: `Real ${BRAND.name} drops for sample shops across the US: the same supplier list, sorted for each crowd.`,
}

// Sample shops, recorded from the live Qloo API by scripts/examples.mjs. No invented users or likes.
const SHOPS = ['denver', 'losangeles', 'austin', 'portland', 'nashville', 'brooklyn']
const COLORS = ['#d9ff3a', '#ff9ecf', '#ffc94a', '#8fd3ff', '#ff7a6b', '#b8a6ff']

function loadShops() {
  return SHOPS.map((id, i) => {
    const ex = JSON.parse(readFileSync(join(process.cwd(), 'public/examples', `${id}.json`), 'utf8'))
    const drop = ex.turns.flatMap((t) => t.replies).find((r) => r.type === 'drop').drop
    const city = drop.city.split(',')[0]
    return { id, label: ex.label, recordedOn: ex.recordedOn, drop, city, color: COLORS[i % COLORS.length] }
  })
}

const initials = (city) => city.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function Feed() {
  const shops = loadShops()
  const count = (group) => {
    const n = {}
    for (const s of shops) for (const r of s.drop.sheet.rows) if (r.group === group) n[r.name] = (n[r.name] || 0) + 1
    return Object.entries(n).sort((a, b) => b[1] - a[1])
  }
  const stocked = count('stock').slice(0, 5)
  const split = count('stock').filter(([name]) => count('skip').some(([n]) => n === name)).slice(0, 4).map(([n]) => n)

  return (
    <>
      <Nav current="feed" />
      <main className="feed-wrap">
        <div>
          <header className="feed-head">
            <p className="kicker">The feed</p>
            <h1 className="display">Same list. <span className="lime">Different crowds.</span></h1>
            <p>
              One supplier list of {shops[1].drop.sheet.rows.length}+ brands, sorted for {shops.length} sample shops. Every drop is real
              {' '}{BRAND.name} output from Qloo, recorded {shops[0].recordedOn}.
            </p>
          </header>

          <nav className="stories" aria-label="Shops">
            {shops.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                <span className="avatar" style={{ background: s.color }}>{initials(s.city)}</span>
                {s.city}
              </a>
            ))}
          </nav>

          {shops.map((s) => {
            const rows = s.drop.sheet.rows
            const top = rows.filter((r) => r.group === 'stock').slice(0, 3).map((r) => r.name)
            const cut = rows.filter((r) => r.group === 'skip').slice(0, 2).map((r) => r.name)
            return (
              <article key={s.id} id={s.id} className="post">
                <header className="post-head">
                  <span className="avatar" style={{ background: s.color }} aria-hidden="true">{initials(s.city)}</span>
                  <div>
                    <b>{s.label}</b>
                    <small>{s.drop.city} · fans of {list(s.drop.loves)}</small>
                  </div>
                  <span className="tag">Sample shop</span>
                </header>
                <div className="post-body">
                  <DropCard drop={s.drop} interactive={false} limit={4} />
                </div>
                <p className="post-caption">
                  <b>{s.city}</b> stocks {list(top)}{cut.length ? <> and skips {list(cut)}</> : null}.
                  {s.drop.baseline?.flips?.length ? <> A generic bestseller list gets {list(s.drop.baseline.flips.slice(0, 3).map((f) => f.name))} the other way round.</> : null}
                </p>
                <div className="post-actions">
                  <Link className="go" href={`/app?example=${s.id}&tab=swipe`}>Swipe it</Link>
                  <Link href={`/app?example=${s.id}`}>Ask the agent</Link>
                  <Link href={`/d/${encodeDrop(s.drop)}`}>Share</Link>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="feed-side">
          <div className="side-card">
            <h2>Most stocked here</h2>
            <p>How many of these {shops.length} shops were told to stock it.</p>
            <ol>{stocked.map(([name, n]) => <li key={name}>{name} <span>{n} / {shops.length}</span></li>)}</ol>
          </div>
          {split.length > 0 && (
            <div className="side-card">
              <h2>Splits the room</h2>
              <p>Stock for one crowd, skip for another. A bestseller list can&apos;t see this.</p>
              <ol>{split.map((name) => <li key={name}>{name} <Link href={`/app?tab=map&map=${encodeURIComponent(name)}`} className="lime">Map it</Link></li>)}</ol>
            </div>
          )}
          <div className="side-card">
            <h2>Your shop next</h2>
            <p>Paste your own supplier list and get your drop in under a minute.</p>
            <Link href="/app" className="btn lime small">Start a drop, free</Link>
          </div>
        </aside>
      </main>
      <Footer />
    </>
  )
}
