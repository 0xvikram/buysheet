'use client'

import { useState } from 'react'
import { parseList } from '../lib/match.js'

const GROUPS = [
  ['stock', 'Stock', 'Strongest fit for your shop'],
  ['consider', 'Consider', 'Middling fit, or mixed evidence'],
  ['skip', 'Skip', 'Weakest fit on this list'],
  ['nosignal', 'No signal', 'Qloo returned nothing; not a verdict'],
]

const EXAMPLES = [
  ['denver', 'Outdoor-leaning gift shop in Denver'],
  ['brooklyn', 'Apothecary and gift shop in Brooklyn'],
]

async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `The server answered ${response.status}.`)
  return data
}

// A match the owner has accepted, as the { id, name } the sheet needs. The owner's wording is kept as the name.
const accepted = (matches, answers) =>
  matches
    .filter((m) => m.state === 'matched' || (m.state === 'check' && answers[m.typed] === true))
    .map((m) => ({ id: m.pick.id, name: m.typed }))

function MatchList({ matches, answers, onAnswer }) {
  const count = (state) => matches.filter((m) => m.state === state).length
  return (
    <div className="matches">
      <p className="tally">
        <b>{count('matched')}</b> matched · <b>{count('check')}</b> to check · <b>{count('unknown')}</b> not known to Qloo
      </p>
      <ul>
        {matches.filter((m) => m.state !== 'matched').map((m) => (
          <li key={m.typed} className={m.state}>
            <div>
              <strong>{m.typed}</strong>
              {m.state === 'check' ? (
                <span> Qloo found <em>{m.pick.name}</em>{m.pick.about ? `: ${m.pick.about}` : ''}</span>
              ) : (
                <span> Not found. It is left off the sheet, not guessed.</span>
              )}
            </div>
            {m.state === 'check' && (
              <div className="yesno" role="group" aria-label={`Is ${m.pick.name} the right match for ${m.typed}?`}>
                <button aria-pressed={answers[m.typed] === true} onClick={() => onAnswer(m.typed, true)}>That's it</button>
                <button aria-pressed={answers[m.typed] === false} onClick={() => onAnswer(m.typed, false)}>Not it</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Sheet({ sheet, shop }) {
  const [open, setOpen] = useState(null)
  return (
    <section className="sheet" aria-label="Buy sheet">
      <header>
        <p className="kicker">Buy sheet</p>
        <h2>
          {shop.city ? `A shop in ${shop.city}` : 'A shop'}
          {shop.signals.length > 0 && <> whose customers love {shop.signals.map((s) => s.name).join(', ')}</>}
        </h2>
        <p className="fine">
          {shop.signals.length > 0 && <>Taste reading for {sheet.read.taste} of {sheet.read.of} brands. </>}
          {shop.city && <>Local reading for {sheet.read.place} of {sheet.read.of}{sheet.placeReadAs ? `; Qloo read the place as ${sheet.placeReadAs}` : ''}.</>}
        </p>
      </header>
      <div className="columns">
        {GROUPS.map(([key, label, note]) => (
          <div key={key} className={`column ${key}`}>
            <h3>{label} <span>{sheet.counts[key]}</span></h3>
            <p className="fine">{note}</p>
            <ul>
              {sheet.rows.filter((r) => r.group === key).map((r) => (
                <li key={r.id}>
                  <button className="brand" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                    <span className="pos">{r.taste ?? r.place ?? '–'}</span>
                    {r.name}
                  </button>
                  {open === r.id && <ul className="reasons">{r.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
                </li>
              ))}
              {sheet.counts[key] === 0 && <li className="none">None</li>}
            </ul>
          </div>
        ))}
      </div>
      <p className="fine caution">
        Taste leads; a strong local reading lifts a brand one group and a weak one lowers it. Positions are within this
        list only and show what this crowd tends to like, not what will sell. Tap a brand for its reasons.
      </p>
    </section>
  )
}

function Plain({ plain, sheet }) {
  if (!plain) return <p className="fine">Asking a plain AI the same question…</p>
  if (!plain.available) return <p className="fine">The plain-AI comparison is unavailable right now. {plain.why}</p>
  const guessed = {}
  for (const [group, names] of Object.entries(plain.groups)) for (const n of names) guessed[n] = group
  const rated = sheet.rows.filter((r) => r.group !== 'nosignal' && guessed[r.name])
  const same = rated.filter((r) => guessed[r.name] === r.group).length
  const opposite = rated.filter((r) => [guessed[r.name], r.group].sort().join() === 'skip,stock')
  return (
    <>
      <p>
        The same question went to a language model with no Qloo data. It agreed on <b>{same} of {rated.length}</b> brands
        {opposite.length > 0 ? <> and made the <b>opposite call on {opposite.length}</b>.</> : '.'}
      </p>
      {opposite.length > 0 && (
        <table>
          <thead><tr><th>Brand</th><th>With Qloo</th><th>Plain AI</th></tr></thead>
          <tbody>
            {opposite.map((r) => (
              <tr key={r.id}><td>{r.name}</td><td className={r.group}>{r.group}</td><td className={guessed[r.name]}>{guessed[r.name]}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="fine">A difference does not prove either side right. It shows where Qloo's data changed the answer. Model: {plain.model}.</p>
    </>
  )
}

function Trace({ trace }) {
  const short = (v) => String(v).replace(/[0-9A-F]{8}-[0-9A-F-]{27}/gi, (id) => `${id.slice(0, 8)}…`)
  return (
    <ol className="trace">
      {trace.map((t, i) => (
        <li key={i}>
          <div><b>{t.label}</b> <span className="fine">{t.status} · {t.results ?? 0} result{t.results === 1 ? '' : 's'} · {t.cached ? 'cached' : `${t.ms} ms`}</span></div>
          <code>GET {t.path}?{Object.entries(t.params).map(([k, v]) => `${k}=${short(v)}`).join('&')}</code>
        </li>
      ))}
    </ol>
  )
}

export default function Page() {
  const [list, setList] = useState('')
  const [matches, setMatches] = useState(null)
  const [answers, setAnswers] = useState({})
  const [city, setCity] = useState('')
  const [loves, setLoves] = useState('')
  const [result, setResult] = useState(null) // { sheet, shop }
  const [plain, setPlain] = useState(null)
  const [trace, setTrace] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const fail = (e) => { setError(e.message); setBusy('') }
  const reset = () => { setResult(null); setPlain(null); setError(''); setNote('') }

  async function matchBrands() {
    reset(); setMatches(null); setAnswers({}); setTrace([])
    try {
      const names = parseList(list).slice(0, 50)
      const found = []
      const calls = []
      // a few names per request, so progress shows and no request runs long
      for (let i = 0; i < names.length; i += 8) {
        setBusy(`Matching brands… ${Math.min(i + 8, names.length)} of ${names.length}`)
        const data = await post('/api/match', { text: names.slice(i, i + 8).join('\n'), kind: 'brand' })
        found.push(...data.matches); calls.push(...data.trace)
      }
      setMatches(found); setTrace(calls); setBusy('')
    } catch (e) { fail(e) }
  }

  async function build() {
    reset(); setBusy('Building the sheet…')
    try {
      let signals = []
      let all = [...trace]
      if (loves.trim()) {
        const data = await post('/api/match', { text: loves, kind: 'signal' })
        all = [...all, ...data.trace]
        // A partial match here is used but named on the sheet, so a wrong one is visible and can be removed.
        signals = data.matches.filter((m) => m.pick).map((m) => ({ id: m.pick.id, name: m.pick.name }))
        const missed = data.matches.filter((m) => !m.pick).map((m) => m.typed)
        if (missed.length) setNote(`Qloo did not know: ${missed.join(', ')}. Left out.`)
      }
      // a brand the customers already love is part of the question, so it is not also an answer
      const brands = accepted(matches, answers).filter((b) => !signals.some((s) => s.id === b.id))
      const data = await post('/api/sheet', { brands, signals, city })
      const shop = { city: city.trim(), signals }
      setResult({ sheet: data.sheet, shop }); setTrace([...all, ...data.trace]); setBusy('')
      post('/api/baseline', { brands: brands.map((b) => b.name), signals: signals.map((s) => s.name), city })
        .then(setPlain)
        .catch(() => setPlain({ available: false, why: 'It could not be reached.' }))
    } catch (e) { fail(e) }
  }

  async function loadExample(name) {
    reset(); setBusy('Loading the example…')
    try {
      const data = await (await fetch(`/examples/${name}.json`)).json()
      setList(data.list); setMatches(data.matches); setAnswers(data.answers); setCity(data.shop.city)
      setLoves(data.loves); setResult({ sheet: data.sheet, shop: data.shop }); setPlain(data.plain); setTrace(data.trace)
      setNote(`Saved example, made on ${data.madeOn}. Change anything and build again to run it live.`); setBusy('')
    } catch { fail(new Error('The example could not be loaded.')) }
  }

  const ready = matches ? accepted(matches, answers).length : 0
  const unanswered = matches ? matches.filter((m) => m.state === 'check' && answers[m.typed] === undefined).length : 0

  return (
    <main>
      <header className="masthead">
        <p className="logo">Buysheet</p>
        <h1>What should your shop stock?</h1>
        <p className="lead">
          Paste a supplier's brand list. Say where your shop is and what your customers already love. Get the list sorted
          into stock, consider and skip, with the evidence for each brand.
        </p>
        <div className="examples">
          <span>Try an example:</span>
          {EXAMPLES.map(([name, label]) => <button key={name} className="ghost" onClick={() => loadExample(name)}>{label}</button>)}
        </div>
      </header>

      <section className="step">
        <h2><span>1</span> The supplier's brands</h2>
        <label htmlFor="list">One brand per line, or separated by commas. Up to 50.</label>
        <textarea id="list" rows={7} value={list} onChange={(e) => setList(e.target.value)} placeholder={'Baggu\nLe Labo\nTopo Designs\nFilson\n…'} />
        <button className="primary" onClick={matchBrands} disabled={!list.trim() || !!busy}>Match these brands</button>
        {matches && <MatchList matches={matches} answers={answers} onAnswer={(typed, yes) => setAnswers({ ...answers, [typed]: yes })} />}
      </section>

      {matches && (
        <section className="step">
          <h2><span>2</span> Your shop</h2>
          <div className="fields">
            <div>
              <label htmlFor="city">Where is it?</label>
              <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Denver, Colorado" />
            </div>
            <div>
              <label htmlFor="loves">What do your customers already love? Up to 5 brands, musicians, shows or films.</label>
              <input id="loves" value={loves} onChange={(e) => setLoves(e.target.value)} placeholder="Patagonia, Carhartt, Tyler Childers" />
            </div>
          </div>
          <button className="primary" onClick={build} disabled={!!busy || ready < 3 || (!city.trim() && !loves.trim())}>
            Build the buy sheet
          </button>
          <p className="fine">
            {ready} brand{ready === 1 ? '' : 's'} ready.
            {unanswered > 0 && ` ${unanswered} still to check above; unanswered ones are left out.`}
            {ready < 3 && ' A sheet needs at least 3.'}
          </p>
        </section>
      )}

      <div aria-live="polite">
        {busy && <p className="status">{busy}</p>}
        {error && <p className="status error">{error}</p>}
        {note && <p className="status note">{note}</p>}
      </div>

      {result && (
        <>
          <Sheet sheet={result.sheet} shop={result.shop} />
          <section className="panel">
            <h2>What a plain AI would say</h2>
            <Plain plain={plain} sheet={result.sheet} />
          </section>
        </>
      )}

      {trace.length > 0 && (
        <details className="panel">
          <summary>Show the work: {trace.length} Qloo call{trace.length === 1 ? '' : 's'}</summary>
          <Trace trace={trace} />
        </details>
      )}

      <footer>
        <p>Built on Qloo's Taste AI for the Qloo Agentic Hackathon. Results describe what groups of people tend to like. They are not predictions about any one person, or about sales.</p>
      </footer>
    </main>
  )
}
