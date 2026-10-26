import Link from 'next/link'
import { notFound } from 'next/navigation'
import DropCard from '../../../components/DropCard.js'
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
  return (
    <>
      <Nav />
      <main className="shared">
        <p className="kicker">A {BRAND.name} drop</p>
        <h1 className="display">{drop.title}</h1>
        <DropCard drop={drop} interactive={false} />
        <p className="mute small" style={{ marginTop: 14 }}>
          Shared by the shop. The reasons for each brand stay with them; make your own drop to see yours.
        </p>
        <div className="ctas">
          <Link href="/app" className="btn lime">Make your own drop</Link>
          <Link href="/feed" className="btn">See the feed</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
