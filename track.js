// ═══════════════════════════════════════════════════════════════════
// EXPERIENCE NODE GRAPH
// Every role, course and certification is a node drifting gently in
// place, linked to the next one in time by a curved edge — a little
// signal travels the chain from the first node to the latest.
// Hovering a node shows its highlights in the panel underneath.
// The <ol class="track-list"> in index.html is the source — without JS
// it shows as a plain list.
// ═══════════════════════════════════════════════════════════════════

// vertical rhythm of the chain, as a fraction of the canvas height
const WAVE = [0.66, 0.3, 0.7, 0.34, 0.68, 0.32, 0.64]

const month = (s) => {
  const [y, m] = s.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export function initTrack() {
  const root = document.getElementById('expTrack')
  if (!root) return

  const items = [...root.querySelectorAll('.track-list > li')]
    .map((li) => ({
      kind: li.dataset.kind,
      start: month(li.dataset.start),
      ongoing: li.dataset.kind === 'work' && !li.dataset.end,
      short: li.dataset.short || li.querySelector('h3').textContent,
      when: li.querySelector('.track-when').textContent,
      title: li.querySelector('h3').innerHTML,
      org: li.querySelector('.track-org').innerHTML,
      stats: li.querySelector('.track-stats').innerHTML,
    }))
    .sort((a, b) => a.start - b.start)

  const n = items.length
  const nodes = items
    .map((it, i) => {
      const cls = ['node', it.kind, it.ongoing ? 'current' : ''].join(' ')
      const year = it.when.replace(/\s*·.*$/, '')
      return `<button class="${cls}" type="button" data-i="${i}" style="transition-delay:${0.15 + i * 0.12}s">
        <span class="node-dot"></span>
        <span class="node-label"><b>${it.short}</b><small>${year}</small></span>
      </button>`
    })
    .join('')
  const edges = items
    .slice(1)
    .map((it, i) => `<path class="edge ${it.kind === 'next' ? 'next' : ''}" data-a="${i}" data-b="${i + 1}" pathLength="1" style="transition-delay:${0.4 + i * 0.15}s"/>`)
    .join('')

  root.insertAdjacentHTML(
    'beforeend',
    `<div class="track-scroller"><div class="track-canvas">
       <svg class="edges" aria-hidden="true">${edges}<circle class="signal" r="4"/></svg>
       ${nodes}
     </div></div>
     <div class="track-panel" aria-live="polite"></div>
     <p class="track-hint">Hover a node to see it here.</p>`
  )
  root.classList.add('track-ready')

  const canvas = root.querySelector('.track-canvas')
  const svg = canvas.querySelector('.edges')
  const panel = root.querySelector('.track-panel')
  const scroller = root.querySelector('.track-scroller')
  const targets = [...canvas.querySelectorAll('.node')]
  const paths = [...svg.querySelectorAll('.edge')]
  const signal = svg.querySelector('.signal')

  // ── layout: base positions + a slow individual drift for each node ──
  let W = 0
  let H = 0
  const base = items.map((_, i) => ({
    fx: n === 1 ? 0.5 : 0.07 + (0.86 * i) / (n - 1),
    fy: WAVE[i % WAVE.length],
    amp: 7 + (i % 3) * 3,
    speed: 0.00045 + (i % 4) * 0.00008,
    phase: i * 1.7,
  }))
  const pos = base.map(() => ({ x: 0, y: 0 }))

  function measure() {
    W = canvas.clientWidth
    H = canvas.clientHeight
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  }

  function place(t) {
    base.forEach((b, i) => {
      const dx = Math.cos(t * b.speed * 0.8 + b.phase) * b.amp * 0.6
      const dy = Math.sin(t * b.speed + b.phase) * b.amp
      pos[i].x = b.fx * W + dx
      pos[i].y = b.fy * H + dy
      targets[i].style.transform = `translate(${pos[i].x}px, ${pos[i].y}px)`
    })
    paths.forEach((p) => {
      const a = pos[+p.dataset.a]
      const b = pos[+p.dataset.b]
      const k = (b.x - a.x) * 0.5
      p.setAttribute('d', `M${a.x},${a.y} C${a.x + k},${a.y} ${b.x - k},${b.y} ${b.x},${b.y}`)
    })
  }

  // the signal runs along the solid edges, rests, then starts over
  const solid = paths.filter((p) => !p.classList.contains('next'))
  const HOP = 1100
  const REST = 1400
  function pulse(t) {
    if (!solid.length) return
    const cycle = solid.length * HOP + REST
    const s = t % cycle
    const hop = Math.floor(s / HOP)
    if (hop >= solid.length) {
      signal.style.opacity = 0
      return
    }
    const p = solid[hop]
    const pt = p.getPointAtLength(((s % HOP) / HOP) * p.getTotalLength())
    signal.setAttribute('cx', pt.x)
    signal.setAttribute('cy', pt.y)
    signal.style.opacity = 1
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)')
  let visible = false
  let raf = 0
  function frame(t) {
    place(t)
    if (still.matches) signal.style.opacity = 0
    else pulse(t)
    raf = visible && !still.matches ? requestAnimationFrame(frame) : 0
  }
  function kick() {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  measure()
  place(0)
  new ResizeObserver(() => {
    measure()
    place(performance.now())
  }).observe(canvas)

  // ── panel ──
  const live = (s) => s.replace(/\b(present|next)\b/, '<span class="live">$1</span>')
  let shown = -1
  function show(i) {
    if (i === shown) return
    shown = i
    const it = items[i]
    targets.forEach((el) => el.classList.toggle('on', +el.dataset.i === i))
    paths.forEach((p) => p.classList.toggle('on', +p.dataset.a === i || +p.dataset.b === i))
    panel.classList.add('swap')
    setTimeout(() => {
      panel.innerHTML = `<div><div class="track-when">${live(it.when)}</div><h3>${it.title}</h3><div class="track-org">${it.org}</div></div>
        <dl class="track-stats">${it.stats}</dl>`
      panel.classList.remove('swap')
    }, 180)
  }

  const current = Math.max(0, items.findIndex((it) => it.ongoing))
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

  // ── appear when scrolled into view; only animate while on screen ──
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting
      if (visible) {
        canvas.classList.add('in')
        kick()
      }
    },
    { threshold: 0.3 }
  ).observe(canvas)
  still.addEventListener('change', kick)

  // phones scroll the graph sideways — start at "now"
  scroller.scrollLeft = scroller.scrollWidth
}
