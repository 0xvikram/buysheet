import { Analytics } from '@vercel/analytics/next'
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

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0b0b' }

// Dark is the default; a saved choice is applied before the first paint so nothing flashes.
const THEME_SCRIPT = `try{var t=localStorage.getItem('restocked:theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        {/* Vercel Web Analytics: page views, no cookies; only reports once enabled for the project on Vercel */}
        <Analytics />
      </body>
    </html>
  )
}
