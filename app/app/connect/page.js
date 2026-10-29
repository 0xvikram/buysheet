'use client'

import { useEffect, useState } from 'react'
import Icon from '../../../components/app/Icon.js'
import { Topbar } from '../../../components/app/Shell.js'
import { useWorkspace } from '../../../components/app/Workspace.js'
import { BRAND } from '../../../lib/brand.js'
import { TOOLS } from '../../../lib/mcp.js'

export default function Connect() {
  const { setToast } = useWorkspace()
  const [origin, setOrigin] = useState('https://your-restocked-domain')
  useEffect(() => setOrigin(location.origin), [])
  const config = JSON.stringify({ mcpServers: { [BRAND.slug]: { type: 'http', url: `${origin}/api/mcp` } } }, null, 2)
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setToast('Copied') } catch { setToast('Could not copy') }
  }
  return (
    <>
      <Topbar crumbs={[{ label: 'Connect AI' }]} />
      <div className="page narrow">
        <div className="page-head"><div><h1>Connect your AI assistant</h1><p>{BRAND.name} runs as an MCP server. Add it to Claude, ChatGPT or any MCP client and your assistant can sort lists, map brands and find new ones, with the same Qloo data.</p></div></div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h2>Server URL</h2><span className="right"><button className="btn sm" onClick={() => copy(`${origin}/api/mcp`)}>Copy</button></span></div>
          <div className="card-b"><code className="mono" style={{ fontSize: 13 }}>{origin}/api/mcp</code><p className="faint" style={{ margin: '8px 0 0', fontSize: 12.5 }}>Streamable HTTP · protocol versions 2025-06-18, 2025-03-26 and 2024-11-05 · no key needed</p></div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-h"><h2>Config</h2><span className="right"><button className="btn sm" onClick={() => copy(config)}>Copy</button></span></div>
          <div className="card-b"><pre className="code">{config}</pre></div>
        </div>
        <div className="card">
          <div className="card-h"><h2>Tools</h2><span className="right faint" style={{ fontSize: 12 }}>{TOOLS.length} tools</span></div>
          <ul className="list">
            {TOOLS.map((t) => <li key={t.name}><div className="rowlink" style={{ alignItems: 'flex-start' }}><Icon name="bolt" /><span className="grow"><b className="mono" style={{ fontSize: 13 }}>{t.name}</b><small style={{ display: 'block', marginTop: 2 }}>{t.description}</small></span></div></li>)}
          </ul>
        </div>
      </div>
    </>
  )
}
