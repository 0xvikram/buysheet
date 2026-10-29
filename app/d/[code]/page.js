import Link from 'next/link'
import { notFound } from 'next/navigation'
import DropTable from '../../../components/app/DropTable.js'
import Footer from '../../../components/Footer.js'
import Nav from '../../../components/Nav.js'
import { BRAND } from '../../../lib/brand.js'
import { decodeDrop } from '../../../lib/share.js'

const no = (n) => String(n).padStart(2, '0')

export async function generateMetadata({ params }) {
  const drop = decodeDrop((await params).code)
  if (!drop) return { title: 'Drop not found' }
  const c = drop.sheet.counts
  const description = `${c.stock} to stock, ${c.consider} to consider, ${c.skip} to skip. Sorted by ${BRAND.name}, the buying agent for independent shops.`
  return {
    title: `Drop #${no(drop.number)}: ${drop.title}`,
    description,
    openGraph: { title: `Drop #${no(drop.number)} · ${drop.title}`, description },
    twitter: { card: 'summary_large_image', title: `Drop #${no(drop.number)} · ${drop.title}`, description },
  }
}

export default async function SharedDrop({ params }) {
  const drop = decodeDrop((await params).code)
  if (!drop) notFound()
  const c = drop.sheet.counts
  return (
    <>
      <Nav />
      <main className="shared">
        <p className="kicker">Shared drop #{no(drop.number)}</p>
        <h1>{drop.title}</h1>
        <div className="meta" style={{ marginBottom: 18 }}>
          <span><i className="dot stock" /> <b>{c.stock}</b> stock</span><span><i className="dot consider" /> <b>{c.consider}</b> consider</span><span><i className="dot skip" /> <b>{c.skip}</b> skip</span>
          <span>Reasons stay private to the shop</span>
        </div>
        <DropTable drop={drop} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link href="/app/new" className="btn primary">Sort your own list, free</Link>
          <Link href="/app/explore" className="btn">See sample shops</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
