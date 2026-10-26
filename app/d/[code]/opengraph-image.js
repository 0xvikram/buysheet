import { ImageResponse } from 'next/og'
import { BRAND } from '../../../lib/brand.js'
import { decodeDrop } from '../../../lib/share.js'

export const alt = `A ${BRAND.name} drop`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#11121c'
const LIME = '#d9ff3a'

const Pill = ({ name, kind }) => (
  <div
    style={{
      display: 'flex', padding: '8px 16px', borderRadius: 12, fontSize: 26, fontWeight: 700, marginRight: 10, marginBottom: 10,
      background: kind === 'stock' ? LIME : 'transparent', color: kind === 'stock' ? INK : '#7c8297',
      border: kind === 'stock' ? 'none' : '2px solid #2e3246', textDecoration: kind === 'skip' ? 'line-through' : 'none',
    }}
  >
    {name}
  </div>
)

export default async function Image({ params }) {
  const drop = decodeDrop((await params).code)
  const rows = drop?.sheet.rows ?? []
  const pick = (g, n) => rows.filter((r) => r.group === g).slice(0, n)
  const c = drop?.sheet.counts ?? { stock: 0, consider: 0, skip: 0 }
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: INK, color: '#f3f4ec', padding: '56px 64px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 36, fontWeight: 800 }}>
          <svg width="52" height="52" viewBox="0 0 48 48">
            <g transform="rotate(-14 24 24)">
              <path d="M15 8h23a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H15L4.6 25.7a3 3 0 0 1 0-3.4z" fill={LIME} />
              <circle cx="13.5" cy="24" r="3" fill={INK} />
              <path d="M22 24.5l5 5 10-11" fill="none" stroke={INK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <span style={{ marginLeft: 16 }}>{BRAND.name}</span>
          <span style={{ marginLeft: 'auto', color: LIME, fontSize: 40 }}>#{String(drop?.number ?? 1).padStart(2, '0')}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 50, fontWeight: 800, marginTop: 34, lineHeight: 1.1, letterSpacing: -1.5 }}>
          {(drop?.title || 'A buy sheet').slice(0, 80)}
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#9aa0b4', marginTop: 16 }}>
          {`${c.stock} to stock · ${c.consider} to consider · ${c.skip} to skip`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 34 }}>
          {pick('stock', 5).map((r) => <Pill key={r.id} name={r.name} kind="stock" />)}
          {pick('skip', 3).map((r) => <Pill key={r.id} name={r.name} kind="skip" />)}
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 22, color: '#9aa0b4' }}>
          {BRAND.tagline} · Built on Qloo taste data
        </div>
      </div>
    ),
    size,
  )
}
