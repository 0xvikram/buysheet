import { Geist, Geist_Mono } from 'next/font/google'
import { BRAND } from '../lib/brand.js'
import './globals.css'

// One modern sans for headlines and text, plus its mono for small labels and code.
const sans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata = {
  title: { default: `${BRAND.name}: ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: BRAND.pitch,
}

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#11121c' }

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
