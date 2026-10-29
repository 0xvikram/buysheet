// Records the guided demo on the landing page by driving the real app: a pointer, click ripples and
// short captions are drawn into the page, frames are captured, and ffmpeg makes public/demo.mp4 and a poster frame.
// Needs the app running (npm start) and ffmpeg. Recording tool, not a dependency:
//   npm i --no-save playwright-core && node scripts/record-demo.mjs [http://localhost:3000]
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const U = process.argv[2] || 'http://localhost:4310'
const OUT = new URL('../public/', import.meta.url).pathname
const WORK = join(tmpdir(), 'restocked-demo-frames')
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const W = 1440
const H = 900
const words = (t) => t.split(/\s+/).length
const hold = (t) => Math.round((1 + 0.3 * words(t)) * 1000) // long enough to read

// The overlay: pointer, ripple, caption and end card, re-created on every page load.
const OVERLAY = () => {
  const css = `
    #dm-pointer{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transition:transform .75s cubic-bezier(.3,.7,.2,1);filter:drop-shadow(0 6px 14px rgba(0,0,0,.45))}
    .dm-ripple{position:fixed;z-index:2147483646;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2.5px solid #D4FF3F;pointer-events:none;animation:dmr .6s ease-out forwards}
    @keyframes dmr{to{transform:scale(4.5);opacity:0}}
    #dm-cap{position:fixed;left:50%;bottom:34px;z-index:2147483645;transform:translateX(-50%) translateY(12px);opacity:0;transition:opacity .35s,transform .35s;
      background:rgba(11,11,11,.78);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.16);border-radius:16px;
      padding:14px 22px;color:#f5f5f2;font:600 24px/1.25 Geist,var(--font-sans),system-ui,sans-serif;letter-spacing:-.01em;display:flex;align-items:center;gap:14px;max-width:1100px;box-shadow:0 18px 50px rgba(0,0,0,.45)}
    #dm-cap.on{opacity:1;transform:translateX(-50%) translateY(0)}
    #dm-cap b{font:500 13px var(--font-mono),ui-monospace,monospace;color:#0B0B0B;background:#D4FF3F;border-radius:8px;padding:4px 8px}
    #dm-end{position:fixed;inset:0;z-index:2147483647;display:none;place-items:center;background:#0B0B0B;color:#f5f5f2;text-align:center;font-family:Geist,var(--font-sans),system-ui,sans-serif}
    #dm-end.on{display:grid}
    #dm-end h1{font-size:76px;letter-spacing:-.05em;margin:18px 0 8px}#dm-end h1 em{font-style:normal;color:#D4FF3F}
    #dm-end p{font-size:22px;color:rgba(245,245,242,.7);margin:0}#dm-end .u{margin-top:26px;display:inline-block;background:#D4FF3F;color:#0B0B0B;font-weight:700;font-size:20px;padding:12px 22px;border-radius:12px}`
  const mount = () => {
    if (document.getElementById('dm-pointer')) return
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s)
    const p = document.createElement('div'); p.id = 'dm-pointer'
    p.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.5L10 19z" fill="#D4FF3F" stroke="#0B0B0B" stroke-width="1.4" stroke-linejoin="round"/></svg>'
    p.style.transform = `translate(${innerWidth / 2}px, ${innerHeight / 2}px)`
    const c = document.createElement('div'); c.id = 'dm-cap'
    const e = document.createElement('div'); e.id = 'dm-end'
    e.innerHTML = '<div><svg width="72" height="72" viewBox="0 0 48 48"><g transform="rotate(-14 24 24)"><path d="M15 8h23a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H15L4.6 25.7a3 3 0 0 1 0-3.4z" fill="#D4FF3F"/><circle cx="13.5" cy="24" r="3" fill="#0B0B0B"/><path d="M22 24.5l5 5 10-11" fill="none" stroke="#0B0B0B" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg><h1>Know what <em>pops</em> before you buy.</h1><p>Restocked · the buying agent for independent shops · built on Qloo</p><span class="u">Try the live demo · no sign-up</span></div>'
    document.body.append(p, c, e)
  }
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount)
  window.__dm = {
    move(x, y) { const p = document.getElementById('dm-pointer'); if (p) p.style.transform = `translate(${x - 4}px, ${y - 3}px)` },
    ripple(x, y) { const r = document.createElement('span'); r.className = 'dm-ripple'; r.style.left = `${x}px`; r.style.top = `${y}px`; document.body.appendChild(r); setTimeout(() => r.remove(), 700) },
    caption(n, text) { const c = document.getElementById('dm-cap'); if (!c) return; c.classList.remove('on'); setTimeout(() => { c.innerHTML = n ? `<b>${n}</b>${text}` : text; c.classList.add('on') }, text ? 120 : 0); if (!text) c.classList.remove('on') },
    end() { document.getElementById('dm-end')?.classList.add('on') },
  }
}

rmSync(WORK, { recursive: true, force: true })
mkdirSync(WORK, { recursive: true })
const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => { try { localStorage.setItem('restocked:theme', 'dark'); localStorage.setItem('restocked:tour-done', '1') } catch {} })
await ctx.addInitScript(OVERLAY)
const p = await ctx.newPage()
const wait = (ms) => p.waitForTimeout(ms)

// set up the sample shop before recording starts
await p.goto(`${U}/app`)
await p.click('text=Explore with a sample shop')
await p.waitForSelector('.kpis')

const center = async (sel) => {
  const box = await p.locator(sel).first().boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const point = async (sel, { click = false, dx = 0 } = {}) => {
  const c = await center(sel)
  await p.evaluate(({ x, y }) => window.__dm.move(x, y), { x: c.x + dx, y: c.y })
  await wait(850)
  if (click) {
    await p.evaluate(({ x, y }) => window.__dm.ripple(x, y), { x: c.x + dx, y: c.y })
    await p.locator(sel).first().click()
    await wait(350)
  }
}
const say = async (n, text, extra = 0) => {
  await p.evaluate(({ n, text }) => window.__dm.caption(n, text), { n, text })
  return hold(text) + extra
}

// frames, with the time each one appeared, so the video plays at real speed
const cdp = await ctx.newCDPSession(p)
const frames = []
cdp.on('Page.screencastFrame', async (e) => {
  const file = join(WORK, `f${String(frames.length).padStart(5, '0')}.jpg`)
  writeFileSync(file, Buffer.from(e.data, 'base64'))
  frames.push({ file, t: e.metadata.timestamp })
  await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {})
})
const record = async () => cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 })

// 1. paste a list
await p.goto(`${U}/app/new`)
await p.waitForSelector('#o-list')
await record()
await wait(400)
let t = await say('1', 'Paste any supplier’s brand list')
await point('#o-name', { click: true })
await p.keyboard.type('Spring order', { delay: 45 })
await point('text=Use a sample list', { click: true })
await wait(Math.max(600, t - 2600))
await point('button:has-text("Sort")')
await wait(500)

// 2. the drop
await p.goto(`${U}/app/drops/1`)
await p.waitForSelector('.table')
t = await say('2', 'Restocked sorts every brand for your crowd, using Qloo’s taste data')
await point('.kpis .kpi >> nth=0'); await point('.kpis .kpi >> nth=2')
await wait(Math.max(300, t - 1700))

// 3. reasons
t = await say('3', 'Every call comes with its reasons')
await point('.table tbody tr.row >> nth=0', { click: true, dx: -260 })
await wait(t)

// 4. bestseller flip
t = await say('4', 'Where a bestseller list gets it wrong for this crowd')
await point('.flip.yes >> nth=0')
await wait(t)

// 5. review
t = await say('5', 'Review in seconds: → stock · ← skip · ↑ consider')
await point('[role=tab]:has-text("Review")', { click: true })
await wait(700)
for (const k of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowRight']) { await p.keyboard.press(k); await wait(650) }
await wait(Math.max(300, t - 2600))

// 6. order
t = await say('6', 'Your calls become the order to the supplier')
await point('[role=tab]:has-text("Order")', { click: true })
await wait(600)
await point('a:has-text("Approve")')
await wait(t)

// 7. map
t = await say('7', 'See where a brand sells best across 12 US cities')
await point('[role=tab]:has-text("Map")', { click: true })
await p.selectOption('select[aria-label="Brand to map"]', { label: 'Filson' })
await wait(t + 400)

// 8. ask the agent
t = await say('8', 'Ask the agent anything')
await point('[role=tab]:has-text("Table")', { click: true })
await point('.composer textarea', { click: true })
await p.keyboard.type('Why skip Baggu?', { delay: 55 })
await p.keyboard.press('Enter')
await p.waitForFunction(() => document.querySelectorAll('.thread .m-bot').length && !document.querySelector('.typing'), null, { timeout: 15000 })
await wait(Math.max(2600, t))

// end card
await p.evaluate(() => { window.__dm.caption('', ''); window.__dm.end() })
await wait(3600)
await cdp.send('Page.stopScreencast')
await browser.close()

// stitch at real timing, then encode
const list = frames.map((f, i) => `file '${f.file}'\nduration ${((frames[i + 1]?.t ?? f.t + 0.5) - f.t).toFixed(3)}`).join('\n') + `\nfile '${frames.at(-1).file}'\n`
writeFileSync(join(WORK, 'list.txt'), list)
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
ff(['-f', 'concat', '-safe', '0', '-i', join(WORK, 'list.txt'), '-vf', 'scale=1280:-2,fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-movflags', '+faststart', '-an', join(OUT, 'demo.mp4')])
ff(['-ss', '6', '-i', join(OUT, 'demo.mp4'), '-frames:v', '1', '-q:v', '4', join(OUT, 'demo-poster.jpg')])
rmSync(WORK, { recursive: true, force: true })
console.log(`recorded ${frames.length} frames → public/demo.mp4, demo-poster.jpg`)
