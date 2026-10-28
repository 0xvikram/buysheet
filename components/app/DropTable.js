'use client'

import { Fragment, useState } from 'react'
import { GROUPS } from '../../lib/grade.js'
import { positions } from '../../lib/workspace.js'
import Icon from './Icon.js'

const FILTERS = ['all', 'stock', 'consider', 'skip']
const CALLS = [['stock', 'check'], ['consider', 'question'], ['skip', 'x']]

function Rank({ p }) {
  if (!p) return <span className="faint" style={{ fontSize: 12.5 }}>No reading</span>
  return (
    <div className="rank" title={`${p.at} of ${p.of}`}>
      <div className="bar"><i style={{ width: `${Math.max(6, Math.round((1 - (p.at - 1) / p.of) * 100))}%` }} /></div>
      {p.at} / {p.of}
    </div>
  )
}

/**
 * A drop as a table. `calls` and `onCall` make the last column editable; without them it's read-only.
 * `flips` are names a bestseller list calls the other way; `generic` maps row id -> its group.
 */
export default function DropTable({ drop, calls, onCall, city, openName }) {
  const rows = drop.sheet.rows
  const generic = drop.baseline?.generic ?? {}
  const flips = new Set((drop.baseline?.flips ?? []).map((f) => f.name))
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(() => rows.find((r) => r.name === openName)?.id ?? null)
  const shown = filter === 'all' ? rows : rows.filter((r) => r.group === filter)
  const where = (city || drop.city || '').split(',')[0]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div className="seg" role="group" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? `All ${rows.length}` : `${GROUPS[f]} ${rows.filter((r) => r.group === f).length}`}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table drop-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Agent</th>
              <th data-tour="ranks">Taste fit</th>
              <th>Local fit{where ? ` · ${where}` : ''}</th>
              <th data-tour="bestseller">Bestseller list</th>
              {onCall && <th data-tour="call">Your call</th>}
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {shown.map((r, n) => {
              const p = positions(r)
              const g = generic[r.id]
              const isOpen = open === r.id
              const mine = calls?.[r.id]
              return (
                <Fragment key={r.id}>
                  <tr className={`row${isOpen ? ' open' : ''}`} onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen} data-tour={n === 0 ? 'row' : undefined}>
                    <td><div className="brand-cell"><span className="logo-sq">{r.name.slice(0, 2)}</span>{r.name}</div></td>
                    <td><span className={`badge ${r.group}`}>{GROUPS[r.group]}</span></td>
                    <td><Rank p={p.taste} /></td>
                    <td><Rank p={p.place} /></td>
                    <td><span className={`flip${flips.has(r.name) ? ' yes' : ''}`}>{g ? GROUPS[g] : '—'}</span></td>
                    {onCall && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {r.group === 'nosignal' ? <span className="faint">—</span> : (
                          <div className="call" role="group" aria-label={`Your call on ${r.name}`}>
                            {CALLS.map(([c, icon]) => (
                              <button key={c} className={c} aria-pressed={(mine || r.group) === c} aria-label={GROUPS[c]} title={mine ? GROUPS[c] : c === r.group ? 'Agent’s call. Click to confirm.' : GROUPS[c]} onClick={() => onCall(r.id, mine === c ? null : c)} style={!mine && c === r.group ? { opacity: 0.65 } : undefined}>
                                <Icon name={icon} size={13} stroke={2.4} />
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="chev-cell"><span style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}><Icon name="chevron" size={14} /></span></td>
                  </tr>
                  {isOpen && (
                    <tr className="reasons">
                      <td colSpan={onCall ? 7 : 6}>
                        <ul>
                          {r.reasons.length ? r.reasons.map((x) => <li key={x}>{x}</li>) : <li>The shop kept the reasons private.</li>}
                          {g && g !== r.group && <li>A generic bestseller list would say {GROUPS[g].toLowerCase()}.</li>}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
