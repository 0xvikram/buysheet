'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DropCard from '../../components/DropCard.js'
import Mark from '../../components/Mark.js'
import Nav from '../../components/Nav.js'
import { BRAND } from '../../lib/brand.js'

const SAVE_KEY = `${BRAND.slug}:conversation`
const WELCOME = {
  from: 'bot',
  text: `Hey, I'm ${BRAND.name}, your buying agent. Tell me where your shop is and what your customers already love, then paste a supplier's brand list (one per line). I'll sort it into stock, consider and skip, and you can ask me anything about the result.`,
}
const START_CHIPS = ['I run a gift shop in Denver. My customers love Patagonia and Tyler Childers.', 'Show me an example']

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

function Card({ reply, onAsk }) {
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
  const log = useRef(null)

  // restore, or open an example / a prefilled question from the landing page
  useEffect(() => {
    const example = params.get('example')
    const ask = params.get('ask')
    if (example) loadExample(example)
    else {
      const saved = load()
      if (saved?.messages?.length) {
        setMessages(saved.messages); setState(saved.state || {}); setDrops(saved.drops || [])
        setShown(saved.drops?.length ? saved.drops.length - 1 : null); setChips(saved.chips || START_CHIPS)
      }
      if (ask) setDraft(ask)
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (ready) save({ messages, state, drops, chips })
  }, [messages, state, drops, chips, ready])

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  function absorb(replies) {
    const newDrops = replies.filter((r) => r.type === 'drop').map((r) => r.drop)
    if (newDrops.length) {
      setDrops((d) => {
        setShown(d.length + newDrops.length - 1)
        return [...d, ...newDrops]
      })
    }
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
          msgs.push(r.type === 'text' ? { from: 'bot', text: r.text } : { from: 'bot', reply: r })
        }
      }
      msgs.push({ from: 'bot', text: `That was a recorded example (${ex.label}, ${ex.recordedOn}). Keep asking: from here on it runs live.` })
      setMessages(msgs); setState(ex.state); setDrops(allDrops); setShown(allDrops.length - 1)
      setChips(ex.turns.at(-1).chips); setTrace(ex.trace)
    } catch {
      setMessages((m) => [...m, { from: 'bot', text: 'That example could not be loaded.', err: true }])
    }
    setBusy(false)
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
    setMessages([WELCOME]); setState({}); setDrops([]); setShown(null); setChips(START_CHIPS); setTrace([])
  }

  const drop = shown !== null ? drops[shown] : null
  const short = (v) => String(v).replace(/[0-9A-F]{8}-[0-9A-F-]{27}/gi, (id) => `${id.slice(0, 8)}…`)

  return (
    <div className="app">
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
            m.reply ? <Card key={i} reply={m.reply} onAsk={send} /> : (
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
