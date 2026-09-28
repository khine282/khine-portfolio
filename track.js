// ═══════════════════════════════════════════════════════════════════
// EXPERIENCE TIME TRACK
// Work and study are bars on a shared timeline, certifications are
// diamonds on the axis. Hovering one shows its highlights in the panel
// underneath; it draws itself in when scrolled into view.
// The <ol class="track-list"> in index.html is the source — without JS
// it shows as a plain list.
// ═══════════════════════════════════════════════════════════════════

const LANES = { work: 30, study: 92, axis: 160 } // y of each lane, px
const LANE_NAMES = { work: 'Work', study: 'Study', axis: 'Milestones' }

const month = (s) => {
  const [y, m] = s.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export function initTrack() {
  const root = document.getElementById('expTrack')
  if (!root) return

  const now = new Date()
  const items = [...root.querySelectorAll('.track-list > li')].map((li) => ({
    kind: li.dataset.kind,
    start: month(li.dataset.start),
    end: li.dataset.end ? month(li.dataset.end) : null,
    short: li.dataset.short,
    when: li.querySelector('.track-when').textContent,
    title: li.querySelector('h3').innerHTML,
    org: li.querySelector('.track-org').innerHTML,
    stats: li.querySelector('.track-stats').innerHTML,
  }))

  // the scale runs from the first January to the end of the latest year shown
  const first = new Date(Math.min(...items.map((it) => it.start)))
  const last = new Date(Math.max(now, ...items.map((it) => it.end || it.start)))
  const from = new Date(first.getFullYear(), 0, 1)
  const to = new Date(last.getFullYear(), 11, 31)
  const x = (d) => ((d - from) / (to - from)) * 100

  let html = ''
  for (const lane of ['work', 'study', 'axis']) {
    html += `<span class="track-lane-name" style="top:${LANES[lane]}px">${LANE_NAMES[lane]}</span>`
    if (lane !== 'axis') html += `<span class="track-rule" style="top:${LANES[lane]}px"></span>`
  }
  html += `<span class="track-axis" style="top:${LANES.axis}px"></span>`

  const years = to.getFullYear() - from.getFullYear() + 1
  for (let i = 0; i < years; i++) {
    const y = from.getFullYear() + i
    html += `<span class="track-tick" style="left:${x(new Date(y, 0, 1))}%; top:${LANES.axis + 18}px; transition-delay:${0.3 + i * 0.12}s">${y}</span>`
  }
  html += `<span class="track-tick now" style="left:${x(now)}%; top:${LANES.axis + 18}px; transition-delay:1s">now</span>`

  let bars = 0
  let marks = 0
  items.forEach((it, i) => {
    if (it.kind === 'work' || it.kind === 'study') {
      const ongoing = !it.end
      const end = it.end || now
      html += `<button class="track-bar ${it.kind} ${ongoing ? 'current' : ''}" type="button" data-i="${i}" aria-label="${it.short}"
        style="left:${x(it.start)}%; width:${x(end) - x(it.start)}%; top:${LANES[it.kind]}px; transition-delay:${0.4 + bars++ * 0.25}s, 0s, 0s"><span>${it.short}</span></button>`
      if (ongoing) html += `<span class="track-now" style="left:${x(now)}%; top:${LANES[it.kind]}px"></span>`
    } else {
      html += `<button class="track-mark ${it.kind === 'next' ? 'next' : ''}" type="button" data-i="${i}" aria-label="${it.when}"
        style="left:${x(it.start)}%; top:${LANES.axis}px; transition-delay:${1.2 + marks++ * 0.15}s, 0s, 0s"></button>`
    }
  })

  root.insertAdjacentHTML(
    'beforeend',
    `<div class="track-scroller"><div class="track-canvas">${html}</div></div>
     <div class="track-panel" aria-live="polite"></div>
     <p class="track-hint">Hover a bar or ◆ milestone to see it here.</p>`
  )
  root.classList.add('track-ready')

  const canvas = root.querySelector('.track-canvas')
  const panel = root.querySelector('.track-panel')
  const scroller = root.querySelector('.track-scroller')
  const targets = canvas.querySelectorAll('[data-i]')

  // ── panel ──
  const live = (s) => s.replace(/\b(present|next)\b/, '<span class="live">$1</span>')
  let shown = -1
  function show(i) {
    if (i === shown) return
    shown = i
    const it = items[i]
    targets.forEach((el) => el.classList.toggle('on', +el.dataset.i === i))
    panel.classList.add('swap')
    setTimeout(() => {
      panel.innerHTML = `<div><div class="track-when">${live(it.when)}</div><h3>${it.title}</h3><div class="track-org">${it.org}</div></div>
        <dl class="track-stats">${it.stats}</dl>`
      panel.classList.remove('swap')
    }, 180)
  }

  const current = Math.max(0, items.findIndex((it) => it.kind === 'work' && !it.end))
  targets.forEach((el) => {
    const pick = () => {
      canvas.classList.add('dimmed')
      show(+el.dataset.i)
    }
    el.addEventListener('mouseenter', pick)
    el.addEventListener('focus', pick)
    el.addEventListener('click', pick)
  })
  canvas.addEventListener('mouseleave', () => {
    canvas.classList.remove('dimmed')
    show(current)
  })
  show(current)

  // ── draw in when scrolled into view ──
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return
      canvas.classList.add('in')
      io.disconnect()
    },
    { threshold: 0.4 }
  )
  io.observe(canvas)

  // phones scroll the track sideways — start at "now"
  scroller.scrollLeft = scroller.scrollWidth
}
