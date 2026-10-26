'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CityMap from '../../components/CityMap.js'
import DropCard from '../../components/DropCard.js'
import Mark from '../../components/Mark.js'
import Nav from '../../components/Nav.js'
import SwipeDeck from '../../components/SwipeDeck.js'
import { BRAND } from '../../lib/brand.js'
import { encodeDrop } from '../../lib/share.js'

const SAVE_KEY = `${BRAND.slug}:conversation`
const WELCOME = {
  from: 'bot',
  text: `Hey, I'm ${BRAND.name}, your buying agent. Tell me where your shop is and what your customers already love, then paste a supplier's brand list (one per line). I'll sort it into stock, consider and skip, and you can ask me anything about the result.`,
}
const START_CHIPS = ['I run a gift shop in Denver. My customers love Patagonia and Tyler Childers.', 'Show me an example']
const TABS = [
  { id: 'agent', label: 'Agent', icon: 'M4 5h16v11H9l-5 4z' },
  { id: 'swipe', label: 'Swipe', icon: 'M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { id: 'map', label: 'Map', icon: 'M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
]
const MAP_PICKS = ['Filson', 'Le Labo', 'Baggu', 'Stanley', 'Glossier']

function Tabs({ tab, setTab, swipeCount }) {
  return (
    <nav className="tabs" aria-label="Views">
      {TABS.map((t) => (
        <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
          <span>{t.label}</span>
          {t.id === 'swipe' && swipeCount > 0 && <em>{swipeCount}</em>}
        </button>
      ))}
      <Link href="/feed">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
        <span>Feed</span>
      </Link>
    </nav>
  )
}

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
  } catch {
    return null
  }
}
const save = (value) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(value))
  } catch {
    // private mode or full storage: the conversation still works, it just isn't kept
  }
}

function Card({ reply, onAsk, onOpenMap }) {
  if (reply.type === 'map') {
    return (
      <div className="msg bot card">
        <h5>Where {reply.map.brand.name} fits</h5>
        <CityMap map={reply.map} compact />
        <button className="linky" onClick={() => onOpenMap(reply.map)}>Open the full map</button>
      </div>
    )
  }
  if (reply.type === 'compare') {
    const { a, b } = reply.compare
    const side = (x) => (
      <div>
        <strong>{x.name}</strong>
        <p style={{ margin: '6px 0' }}>{x.lean}</p>
        {x.stands.length > 0 && <p className="mute" style={{ margin: 0 }}>Stands out for: {x.stands.join(', ')}</p>}
      </div>
    )
    return <div className="msg bot card"><h5>Side by side</h5><div className="cols">{side(a)}{side(b)}</div></div>
  }
  if (reply.type === 'similar') {
    return (
      <div className="msg bot card">
        <h5>Also loved by this crowd</h5>
        <ul>
          {reply.similar.brands.map((x) => (
            <li key={x.id}>
              <button className="linky" onClick={() => onAsk(`Add ${x.name} to my list`)}>{x.name}</button>
              {x.about ? <span className="mute">: {x.about}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (reply.type === 'audience') return null // the sentence already says it
  if (reply.type === 'drop') return <div className="msg bot card"><h5>Drop #{String(reply.drop.number).padStart(2, '0')} is on the right</h5>{reply.drop.title}</div>
  return null
}

function App() {
  const params = useSearchParams()
  const [messages, setMessages] = useState([WELCOME])
  const [state, setState] = useState({})
  const [drops, setDrops] = useState([])
  const [shown, setShown] = useState(null)
  const [chips, setChips] = useState(START_CHIPS)
  const [trace, setTrace] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('agent')
  const [map, setMap] = useState(null)
  const [mapAsk, setMapAsk] = useState('')
  const [toast, setToast] = useState('')
  const [pendingMap, setPendingMap] = useState(null)
  const log = useRef(null)

  // restore, or open an example / a prefilled question from the landing page
  useEffect(() => {
    const example = params.get('example')
    const ask = params.get('ask')
    if (TABS.some((t) => t.id === params.get('tab'))) setTab(params.get('tab'))
    if (params.get('map')) { setTab('map'); setPendingMap(params.get('map').slice(0, 60)) }
    if (example) loadExample(example)
    else {
      const saved = load()
      if (saved?.messages?.length) {
        setMessages(saved.messages); setState(saved.state || {}); setDrops(saved.drops || [])
        setShown(saved.drops?.length ? saved.drops.length - 1 : null); setChips(saved.chips || START_CHIPS)
        setMap(saved.map || null)
      }
      if (ask) setDraft(ask)
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (ready) save({ messages, state, drops, chips, map })
  }, [messages, state, drops, chips, map, ready])

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, tab])

  // a ?map= link runs once the saved conversation is back, so its state is kept
  useEffect(() => {
    if (ready && pendingMap) {
      setPendingMap(null)
      askMap(pendingMap)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pendingMap])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  function absorb(replies) {
    const newDrops = replies.filter((r) => r.type === 'drop').map((r) => r.drop)
    if (newDrops.length) {
      setDrops((d) => {
        setShown(d.length + newDrops.length - 1)
        return [...d, ...newDrops]
      })
    }
    const maps = replies.filter((r) => r.type === 'map')
    if (maps.length) setMap(maps.at(-1).map)
    return replies.map((r) => (r.type === 'text' ? { from: 'bot', text: r.text } : { from: 'bot', reply: r }))
  }

  async function loadExample(name) {
    setBusy(true)
    try {
      const ex = await (await fetch(`/examples/${name}.json`)).json()
      const msgs = [WELCOME]
      const allDrops = []
      for (const t of ex.turns) {
        msgs.push({ from: 'me', text: t.message })
        for (const r of t.replies) {
          if (r.type === 'drop') allDrops.push(r.drop)
          if (r.type === 'map') setMap(r.map)
          msgs.push(r.type === 'text' ? { from: 'bot', text: r.text } : { from: 'bot', reply: r })
        }
      }
      msgs.push({ from: 'bot', text: `That was a recorded example (${ex.label}, ${ex.recordedOn}). Keep asking: from here on it runs live.` })
      // open on the shop's own drop, not a what-if for another city
      const home = allDrops.findLastIndex((d) => !d.whatIf)
      setMessages(msgs); setState(ex.state); setDrops(allDrops); setShown(home >= 0 ? home : allDrops.length - 1)
      setChips(ex.turns.at(-1).chips); setTrace(ex.trace)
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: 'That example could not be loaded.', err: true }])
    }
    setBusy(false)
  }

  async function share(d) {
    const url = `${location.origin}/d/${encodeDrop(d)}`
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: `${BRAND.name} drop #${String(d.number).padStart(2, '0')}`, text: d.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setToast('Link copied. Paste it anywhere.')
    } catch (e) {
      if (e?.name !== 'AbortError') setToast('Could not copy the link.')
    }
  }

  function askMap(name) {
    const brand = name.trim()
    if (!brand) return
    setMapAsk('')
    send(`Where does ${brand} fit?`)
  }

  async function send(text) {
    const message = text.trim()
    if (!message || busy) return
    if (/^show me an example$/i.test(message)) return loadExample('denver')
    setDraft('')
    setChips([])
    setMessages((m) => [...m, { from: 'me', text: message }])
    setBusy(true)
    try {
      const response = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, state }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Something went wrong (${response.status}).`)
      setState(data.state)
      setMessages((m) => [...m, ...absorb(data.replies)])
      setChips(data.chips || [])
      setTrace(data.trace || [])
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: e.message, err: true }])
      setChips(['Try again'])
    }
    setBusy(false)
  }

  function restart() {
    setMessages([WELCOME]); setState({}); setDrops([]); setShown(null); setChips(START_CHIPS); setTrace([]); setMap(null)
  }

  const drop = shown !== null ? drops[shown] : null
  const short = (v) => String(v).replace(/[0-9A-F]{8}-[0-9A-F-]{27}/gi, (id) => `${id.slice(0, 8)}…`)

  const mapPicks = [...new Set([...(drop?.sheet.rows.filter((r) => r.group === 'stock').slice(0, 3).map((r) => r.name) ?? []), ...MAP_PICKS])].slice(0, 6)
  const toSwipe = drop ? drop.sheet.rows.filter((r) => r.group !== 'nosignal').length : 0

  return (
    <>
    <Tabs tab={tab} setTab={setTab} swipeCount={toSwipe} />
    {toast && <div className="toast" role="status">{toast}</div>}

    {tab === 'swipe' && (
      <main className="pane">
        {drop ? (
          <>
            <p className="pane-title"><b>Drop #{String(drop.number).padStart(2, '0')}</b> <span className="mute">{drop.title}</span></p>
            <SwipeDeck drop={drop} onShare={() => share(drop)} />
          </>
        ) : (
          <div className="placeholder">
            <Mark size={56} />
            <span className="big">Nothing to swipe yet</span>
            Make a drop with the agent, or load a real one.
            <div className="deck-actions" style={{ justifyContent: 'center', marginTop: 18 }}>
              <button className="btn lime" onClick={() => loadExample('denver')}>Load the Denver drop</button>
              <button className="btn" onClick={() => setTab('agent')}>Talk to the agent</button>
            </div>
          </div>
        )}
      </main>
    )}

    {tab === 'map' && (
      <main className="pane wide">
        <form className="map-ask" onSubmit={(e) => { e.preventDefault(); askMap(mapAsk) }}>
          <label htmlFor="map-brand">Where does a brand fit?</label>
          <div className="map-row">
            <input id="map-brand" value={mapAsk} onChange={(e) => setMapAsk(e.target.value)} placeholder="Type a brand, e.g. Filson" autoComplete="off" />
            <button className="btn lime" disabled={busy || !mapAsk.trim()}>Map it</button>
          </div>
          <div className="chips-row">
            {mapPicks.map((n) => <button type="button" key={n} className="chip" disabled={busy} onClick={() => askMap(n)}>{n}</button>)}
          </div>
        </form>
        {busy ? (
          <div className="map-wait"><span className="spinner" aria-hidden="true" /> Reading 12 US cities on Qloo, one at a time…</div>
        ) : map ? (
          <>
            <h2 className="map-title display">{map.brand.name}</h2>
            <p className="mute map-text">{map.text}</p>
            <CityMap map={map} />
          </>
        ) : (
          <div className="placeholder">
            <Mark size={56} />
            <span className="big">Map any brand</span>
            See which of 12 US cities it fits best, from Qloo&apos;s local readings.
          </div>
        )}
      </main>
    )}

    <div className="app" hidden={tab !== 'agent'}>
      <section className="chat" aria-label="Conversation with the buying agent">
        <div className="chat-head">
          <h1>Buying agent</h1>
          <div className="actions">
            <button className="chip" onClick={() => loadExample('denver')}>Denver example</button>
            <button className="chip" onClick={() => loadExample('brooklyn')}>Brooklyn example</button>
            <button className="chip" onClick={restart}>New shop</button>
          </div>
        </div>
        <div className="log" ref={log} aria-live="polite">
          {messages.map((m, i) =>
            m.reply ? <Card key={i} reply={m.reply} onAsk={send} onOpenMap={(mp) => { setMap(mp); setTab('map') }} /> : (
              <div key={i} className={`msg ${m.from}${m.err ? ' err' : ''}`}>{m.text}</div>
            ),
          )}
          {busy && <div className="typing">Asking Qloo…</div>}
        </div>
        {chips.length > 0 && !busy && (
          <div className="chips" aria-label="Suggestions">
            {chips.map((c) => <button key={c} className="chip" onClick={() => (c === 'Try again' ? send(messages.filter((m) => m.from === 'me').at(-1)?.text || '') : send(c))}>{c}</button>)}
          </div>
        )}
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
          <label htmlFor="say" className="sr-only">Message</label>
          <textarea
            id="say"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) } }}
            placeholder="Paste a brand list, or ask: why skip Baggu?"
          />
          <button className="btn lime" disabled={busy || !draft.trim()}>Send</button>
        </form>
      </section>

      <aside className="side" aria-label="Your drops">
        {drops.length > 1 && (
          <div className="history" role="group" aria-label="Drops">
            {drops.map((d, i) => (
              <button key={i} aria-pressed={i === shown} onClick={() => setShown(i)}>
                #{String(d.number).padStart(2, '0')} {d.whatIf ? `· ${d.city}` : ''}
              </button>
            ))}
          </div>
        )}
        {drop && (
          <div className="drop-actions">
            <button className="btn lime small" onClick={() => setTab('swipe')}>Swipe through it</button>
            <button className="btn small" onClick={() => share(drop)}>Share</button>
          </div>
        )}
        {drop ? <DropCard drop={drop} /> : (
          <div className="placeholder">
            <Mark size={56} />
            <span className="big">Your drop lands here</span>
            Stock, consider and skip, with the reasons for every brand.
          </div>
        )}
        {trace.length > 0 && (
          <details className="work">
            <summary>Show the work: {trace.length} Qloo call{trace.length === 1 ? '' : 's'} on the last step</summary>
            <ol>
              {trace.map((t, i) => (
                <li key={i}>
                  <b>{t.label}</b> <span className="mute">{t.status} · {t.results ?? 0} result{t.results === 1 ? '' : 's'} · {t.cached ? 'cached' : `${t.ms} ms`}</span>
                  <code>GET {t.path}?{Object.entries(t.params).map(([k, v]) => `${k}=${short(v)}`).join('&')}</code>
                </li>
              ))}
            </ol>
          </details>
        )}
      </aside>
    </div>
    </>
  )
}

export default function AppPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </>
  )
}
