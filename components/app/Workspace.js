'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { BRAND } from '../../lib/brand.js'
import { cleanWorkspace, dropRecord, EMPTY_WORKSPACE, upsertDrop } from '../../lib/workspace.js'

// Holds the shop's workspace in this browser and talks to the agent.
// Accounts (Supabase) will replace the storage; nothing else here needs to change.

const KEY = `${BRAND.slug}:workspace:v2`
const Ctx = createContext(null)

const read = () => {
  try {
    return cleanWorkspace(JSON.parse(localStorage.getItem(KEY) || 'null'))
  } catch {
    return cleanWorkspace(null)
  }
}

export function WorkspaceProvider({ children }) {
  const [ws, setWs] = useState(EMPTY_WORKSPACE)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [menu, setMenu] = useState(false)
  const latest = useRef(ws)
  latest.current = ws

  useEffect(() => {
    setWs(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(ws))
    } catch {
      // full or private storage: the session still works
    }
  }, [ws, ready])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const update = useCallback((fn) => setWs((w) => ({ ...w, ...fn(w) })), [])

  /**
   * One turn with the agent. `opts.state` overrides the conversation state (a new drop starts fresh);
   * `opts.name` / `opts.supplier` label a drop this turn makes. Resolves to the agent's replies.
   */
  const ask = useCallback(async (message, opts = {}) => {
    const text = String(message || '').trim()
    if (!text) return null
    setBusy(true)
    const base = latest.current
    const state = opts.state ?? base.agent.state
    setWs((w) => ({ ...w, agent: { ...w.agent, messages: [...w.agent.messages, { from: 'me', text }], chips: [] } }))
    try {
      const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, state }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Something went wrong (${res.status}).`)
      const replies = data.replies || []
      setWs((w) => {
        let drops = w.drops
        for (const r of replies) {
          if (r.type === 'drop') drops = upsertDrop(drops, dropRecord(r.drop, { name: r.drop.whatIf ? undefined : opts.name, supplier: opts.supplier, trace: data.trace }))
        }
        const maps = [...replies.filter((r) => r.type === 'map').map((r) => r.map), ...w.maps.filter((m) => !replies.some((r) => r.type === 'map' && r.map.brand.id === m.brand.id))].slice(0, 8)
        const msgs = replies.map((r) => (r.type === 'text' ? { from: 'bot', text: r.text } : { from: 'bot', reply: r }))
        return { ...w, drops, maps, agent: { messages: [...w.agent.messages, ...msgs].slice(-120), state: data.state, chips: data.chips || [] } }
      })
      return { replies, chips: data.chips || [], state: data.state }
    } catch (e) {
      setWs((w) => ({ ...w, agent: { ...w.agent, messages: [...w.agent.messages, { from: 'bot', text: e.message, err: true }], chips: ['Try again'] } }))
      return { error: e.message, replies: [], chips: [] }
    } finally {
      setBusy(false)
    }
  }, [])

  const value = { ws, ready, busy, ask, update, replace: setWs, toast, setToast, menu, setMenu }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useWorkspace = () => useContext(Ctx)
