// Owl World — the motion layer for the redesign.
//   · sky parallax (clouds / sun / moon drift at different depths on scroll)
//   · springy split-text entrances for the hero name + section titles
//   · 3D pointer tilt + moving glare on the clay cards
//   · the owl's pupils follow the cursor, and it comments on each section
//   · little sparkle bursts when you click buttons
// Everything degrades to a static page under prefers-reduced-motion,
// and the pointer-driven bits only run on a real mouse.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const wide = window.matchMedia('(min-width: 769px)')

export function initOwlWorld() {
  splitHeroName()
  splitWords('.section-title, .contact-heading')
  indexChildren('.stack-panel', '.stack-row')
  indexChildren('.cert-scroll-container', '.cert-tab-item')
  loopRibbon()

  if (reduce) return

  skyParallax()
  owlEyes()
  owlGuide()
  if (finePointer) {
    tiltCards()
    sparkles()
  }
}

/* ── split text ─────────────────────────────────────────────────────── */

// Wrap every text node under `root` using `wrapText(text) -> Node[]`,
// keeping existing inline markup (e.g. <span class="accent">, <br>).
function eachText(root, wrapText) {
  const nodes = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((node) => {
    if (!node.nodeValue.trim()) return
    const frag = document.createDocumentFragment()
    wrapText(node.nodeValue).forEach((n) => frag.appendChild(n))
    node.parentNode.replaceChild(frag, node)
  })
}

function splitHeroName() {
  const h1 = document.querySelector('.hero-name')
  if (!h1 || h1.dataset.split) return
  h1.dataset.split = '1'
  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim())
  h1.classList.add('split')
  let i = 0
  eachText(h1, (text) =>
    text.split(/(\s+)/).filter(Boolean).map((part) => {
      if (/^\s+$/.test(part)) return document.createTextNode(' ')
      const word = document.createElement('span')
      word.className = 'word'
      word.setAttribute('aria-hidden', 'true')
      for (const c of part) {
        const ch = document.createElement('span')
        ch.className = 'ch'
        ch.textContent = c
        ch.style.setProperty('--i', i++)
        word.appendChild(ch)
      }
      return word
    })
  )
}

function splitWords(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    if (el.dataset.split) return
    el.dataset.split = '1'
    el.classList.add('split')
    let i = 0
    eachText(el, (text) =>
      text.split(/(\s+)/).filter(Boolean).map((part) => {
        if (/^\s+$/.test(part)) return document.createTextNode(' ')
        const w = document.createElement('span')
        w.className = 'w'
        w.textContent = part
        w.style.setProperty('--i', i++)
        return w
      })
    )
  })
}

// give list items an index so CSS can stagger their pop-in when a tab opens
function indexChildren(parentSel, childSel) {
  document.querySelectorAll(parentSel).forEach((p) => {
    p.querySelectorAll(childSel).forEach((c, i) => c.style.setProperty('--i', i))
  })
}

// duplicate the ribbon's items so a -50% translate loops seamlessly
function loopRibbon() {
  const track = document.querySelector('.ribbon-track')
  if (!track || track.dataset.looped) return
  track.dataset.looped = '1'
  track.innerHTML += track.innerHTML
}

/* ── sky parallax ───────────────────────────────────────────────────── */

function skyParallax() {
  const sky = document.querySelector('.sky')
  if (!sky) return
  let ticking = false
  const update = () => {
    sky.style.setProperty('--sy', String(window.scrollY))
    ticking = false
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    },
    { passive: true }
  )
  update()
}

/* ── 3D tilt cards ──────────────────────────────────────────────────── */

function tiltCards() {
  const cards = document.querySelectorAll(
    '.project-card, .stat-card, .exp-card, .edu-card, .spec-row, .avail-card, .about-now'
  )
  cards.forEach((el) => {
    el.classList.add('tilt')
    // big cards tilt less so text stays easy to read
    const max = el.matches('.project-card.featured, .exp-card') ? 4 : el.matches('.stat-card') ? 14 : 7
    const glare = document.createElement('span')
    glare.className = 'tilt-glare'
    glare.setAttribute('aria-hidden', 'true')
    el.appendChild(glare)

    let frame = 0
    el.addEventListener('pointerenter', () => {
      if (!wide.matches) return
      el.style.transitionDelay = '0ms' // drop the reveal stagger once it's on screen
      el.classList.add('is-live')
    })
    el.addEventListener('pointermove', (e) => {
      if (!wide.matches || e.pointerType !== 'mouse') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = clamp((e.clientX - r.left) / r.width, 0, 1)
        const py = clamp((e.clientY - r.top) / r.height, 0, 1)
        el.style.setProperty('--rx', ((0.5 - py) * max).toFixed(2) + 'deg')
        el.style.setProperty('--ry', ((px - 0.5) * max).toFixed(2) + 'deg')
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%')
      })
    })
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame)
      el.classList.remove('is-live')
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    })
  })
}

/* ── owl: eyes follow the cursor ────────────────────────────────────── */

function owlEyes() {
  const owls = document.querySelectorAll('#owlPet, #preloader')
  if (!owls.length) return
  const sets = [...owls].map((host) => ({
    host,
    svg: host.querySelector('svg.owl'),
    pupils: host.querySelectorAll('.owl-eyes circle[fill="currentColor"]'),
  }))
  let x = window.innerWidth / 2
  let y = window.innerHeight / 2
  let frame = 0

  const look = () => {
    frame = 0
    sets.forEach(({ host, svg, pupils }) => {
      if (!svg || !pupils.length || host.hidden || !host.isConnected) return
      const r = svg.getBoundingClientRect()
      if (!r.width) return
      const dx = x - (r.left + r.width / 2)
      const dy = y - (r.top + r.height * 0.36)
      const d = Math.hypot(dx, dy) || 1
      const reach = Math.min(2.6, d / 60) // SVG units; eye socket is r=9.5
      let tx = (dx / d) * reach
      const ty = (dy / d) * reach
      if (host.classList.contains('face-left')) tx = -tx // svg is mirrored
      pupils.forEach((p) => {
        p.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`
      })
    })
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX
      y = e.clientY
      if (!frame) frame = requestAnimationFrame(look)
    },
    { passive: true }
  )
}

/* ── owl: comments as you reach each section ────────────────────────── */

function owlGuide() {
  const lines = {
    about: "that's khine — backend at heart, full-stack in practice",
    experience: 'a whole year shipping to prod',
    projects: 'ooh, the good stuff. try the filters!',
    stack: 'tap the tabs — lots of tools in here',
    certifications: 'psst, this list scrolls. more below ↓',
    contact: 'say hi! khine replies within 24h',
    education: 'pre-med → IT. plot twist',
  }
  const said = new Set()
  let last = 0

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        const id = e.target.id
        if (said.has(id) || typeof window.owlSay !== 'function') return
        const now = Date.now()
        if (now - last < 5000) return // don't chatter while scrolling fast
        if (window.owlSay(lines[id], 4200)) {
          said.add(id)
          last = now
        }
      })
    },
    { threshold: 0.3 }
  )
  Object.keys(lines).forEach((id) => {
    const el = document.getElementById(id)
    if (el) io.observe(el)
  })
}

/* ── click sparkles ─────────────────────────────────────────────────── */

function sparkles() {
  const targets =
    '.btn-primary, .btn-secondary, .nav-cta, .link-btn, .filter-btn, .stack-tab, .cert-tab-btn, .chatbot-toggle, .theme-toggle'
  const glyphs = ['✦', '✧', '★', '•', '✦']
  const colors = ['var(--c-sun)', 'var(--c-pink)', 'var(--c-sky)', 'var(--c-mint)', 'var(--c-lilac)']

  document.addEventListener('click', (e) => {
    const hit = e.target.closest(targets)
    if (!hit || e.detail === 0) return // ignore keyboard-triggered clicks
    const layer = document.createElement('div')
    layer.className = 'sparkle-layer'
    layer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(layer)
    const ox = e.clientX / zoom()
    const oy = e.clientY / zoom()
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('span')
      s.className = 'sparkle'
      s.textContent = glyphs[i % glyphs.length]
      s.style.left = ox + 'px'
      s.style.top = oy + 'px'
      s.style.color = colors[i % colors.length]
      layer.appendChild(s)
      const a = (Math.PI * 2 * i) / 9 + Math.random() * 0.5
      const dist = 34 + Math.random() * 30
      s.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0.4) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${
              Math.sin(a) * dist
            }px)) scale(1) rotate(${90 + Math.random() * 120}deg)`,
            opacity: 0,
          },
        ],
        { duration: 620 + Math.random() * 240, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }
      )
    }
    setTimeout(() => layer.remove(), 950)
  })
}

/* ── utils ──────────────────────────────────────────────────────────── */

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

// the desktop layout sets `html { zoom: .8 }`; fixed-position children then
// live in zoomed coordinates, so pointer positions have to be scaled down
function zoom() {
  return parseFloat(getComputedStyle(document.documentElement).zoom) || 1
}
