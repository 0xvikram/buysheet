import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata = {
  title: 'Buysheet',
  description: 'Paste a supplier’s brand list. See what to stock, consider and skip for your shop, with the evidence.',
}

export const viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
