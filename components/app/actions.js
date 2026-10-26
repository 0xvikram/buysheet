'use client'

import { BRAND } from '../../lib/brand.js'
import { encodeDrop } from '../../lib/share.js'
import { sampleWorkspace, toCsv } from '../../lib/workspace.js'

/** The sample shop: a real recorded Denver conversation, clearly labelled as a sample. */
export async function loadSample() {
  const ex = await (await fetch('/examples/denver.json')).json()
  return sampleWorkspace(ex, { name: 'Mile High Goods', city: 'Denver, Colorado', kind: 'Gift shop', loves: ['Patagonia', 'Carhartt', 'Tyler Childers'] })
}

/** Copy (or, on phones, share) a public link to a drop. */
export async function shareDrop(record, setToast) {
  const url = `${location.origin}/d/${encodeDrop(record.drop)}`
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: `${BRAND.name}: ${record.name}`, text: record.drop.title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    setToast('Share link copied')
  } catch (e) {
    if (e?.name !== 'AbortError') setToast('Could not copy the link')
  }
}

/** Download the drop as a CSV file. */
export function downloadCsv(record) {
  const blob = new Blob([toCsv(record)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${BRAND.slug}-drop-${String(record.number).padStart(2, '0')}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
