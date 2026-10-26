'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BRAND } from '../../lib/brand.js'
import { initials, searchBrands } from '../../lib/workspace.js'
import Mark from '../Mark.js'
import ThemeToggle from '../ThemeToggle.js'
import Icon from './Icon.js'
import { useWorkspace } from './Workspace.js'

const NAV = [
  { href: '/app', label: 'Overview', icon: 'home' },
  { href: '/app/drops', label: 'Drops', icon: 'drops', count: true },
  { href: '/app/agent', label: 'Agent', icon: 'agent' },
  { href: '/app/map', label: 'Market map', icon: 'map' },
  { href: '/app/discover', label: 'Discover brands', icon: 'discover', badge: 'New' },
]
const MORE = [
  { href: '/app/explore', label: 'Sample shops', icon: 'explore' },
  { href: '/app/connect', label: 'Connect AI', icon: 'connect' },
  { href: '/app/settings', label: 'Settings', icon: 'settings' },
]

function NavLink({ item, path, extra }) {
  const on = item.href === '/app' ? path === '/app' : path.startsWith(item.href)
  return (
    <Link href={item.href} aria-current={on ? 'page' : undefined}>
      <Icon name={item.icon} />
      {item.label}
      {extra}
    </Link>
  )
}

export function Sidebar() {
  const { ws, setMenu } = useWorkspace()
  const path = usePathname()
  useEffect(() => setMenu(false), [path, setMenu])
  const shop = ws.shop
  return (
    <aside className="sidebar" aria-label="App">
      <div className="sb-top">
        <Link href="/" className="wordmark" aria-label={`${BRAND.name} home`}><Mark size={24} />{BRAND.name}</Link>
      </div>
      <Link href={shop ? '/app/settings' : '/app/new'} className="sb-ws">
        <span className="ws-av">{shop ? initials(shop.name) : '+'}</span>
        <div style={{ minWidth: 0 }}>
          <b>{shop ? shop.name : 'Set up your shop'}</b>
          <small>{shop ? [shop.city?.split(',')[0], shop.kind].filter(Boolean).join(' · ') : 'Takes a minute'}</small>
        </div>
        <span className="chev"><Icon name="chevrons" size={14} /></span>
      </Link>
      <nav className="sb-nav">
        {NAV.map((n) => (
          <NavLink key={n.href} item={n} path={path} extra={n.count ? <span className="n">{ws.drops.length || ''}</span> : n.badge ? <span className="badge new">{n.badge}</span> : null} />
        ))}
      </nav>
      <div className="sb-label">Workspace</div>
      <nav className="sb-nav">
        {MORE.map((n) => <NavLink key={n.href} item={n} path={path} />)}
      </nav>
      <div className="sb-foot">
        <div className="sb-plan">
          <b>Free · Beta</b>
          <p>{ws.drops.length} drop{ws.drops.length === 1 ? '' : 's'} so far. Unlimited while in beta.</p>
          <div className="meter"><i style={{ width: `${Math.min(100, ws.drops.length * 10)}%` }} /></div>
          <p style={{ margin: '10px 0 0' }}><Link href="/pricing">See plans</Link></p>
        </div>
        <div className="sb-user">
          <span className="pic" aria-hidden="true" />
          <div style={{ minWidth: 0 }}><b>Guest</b><br /><small className="faint">Saved in this browser</small></div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

function Search() {
  const { ws } = useWorkspace()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const input = useRef(null)
  const hits = searchBrands(ws, q)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="search" style={{ position: 'relative' }}>
      <Icon name="search" size={14} />
      <input
        ref={input}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search brands…"
        aria-label="Search brands across your drops"
      />
      <span className="kbd">⌘K</span>
      {open && q.trim() && (
        <div className="card" role="listbox" style={{ position: 'absolute', top: 40, left: 0, right: 0, zIndex: 50, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          {hits.length ? hits.map((h, i) => (
            <button
              key={i}
              role="option"
              aria-selected="false"
              onMouseDown={() => { router.push(`/app/drops/${h.number}?brand=${encodeURIComponent(h.name)}`); setQ('') }}
              style={{ display: 'flex', width: '100%', gap: 8, alignItems: 'center', padding: '9px 12px', border: 0, background: 'none', textAlign: 'left', color: 'var(--text)' }}
            >
              <span className={`dot ${h.group}`} /> <b style={{ fontWeight: 500 }}>{h.name}</b>
              <span className="faint" style={{ marginLeft: 'auto', fontSize: 12 }}>#{String(h.number).padStart(2, '0')} {h.drop}</span>
            </button>
          )) : <p className="mute" style={{ margin: 0, padding: '10px 12px', fontSize: 13 }}>No brand called “{q.trim()}” in your drops. Try <Link href={`/app/map?brand=${encodeURIComponent(q.trim())}`}>mapping it</Link>.</p>}
        </div>
      )}
    </div>
  )
}

export function Topbar({ crumbs = [], actions }) {
  const { setMenu } = useWorkspace()
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" /></button>
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="faint">/</span>}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <b>{c.label}</b>}
          </span>
        ))}
      </nav>
      <Search />
      {actions}
      <Link href="/app/new" className="btn primary sm"><Icon name="plus" size={14} /> <span className="hide-sm">New drop</span></Link>
    </header>
  )
}

export function Shell({ children }) {
  const { menu, setMenu, toast } = useWorkspace()
  return (
    <div className={`shell${menu ? ' drawer' : ''}`}>
      <Sidebar />
      {menu && <button className="scrim" aria-label="Close menu" onClick={() => setMenu(false)} />}
      <div className="main">{children}</div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
