// Bento — page behaviour.
//   · theme toggle, mobile menu, active nav pill
//   · tiles pop in as they scroll into view; a spotlight follows the cursor
//   · live bits: rotating role, Singapore clock, count-up stats, the chat
//     tile typing sample questions, credential tabs
//   · demo videos only play while on screen
//   · the owl's eyes follow the cursor and it comments on each section

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function initBento() {
  themeToggle()
  mobileMenu()
  activeNav()
  revealTiles()
  if (finePointer) spotlight()
  rotateRoles()
  clock()
  countUp()
  askTile()
  certTabs()
  zoomTiles()
  owlEyes()
  owlGuide()
}

function themeToggle() {
  const btn = document.getElementById('themeToggle')
  if (!btn) return
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch (e) {}
  })
}

function mobileMenu() {
  const ham = document.getElementById('navHam')
  const menu = document.getElementById('navMobile')
  if (!ham || !menu) return
  ham.addEventListener('click', () => {
    const open = menu.classList.toggle('open')
    ham.setAttribute('aria-expanded', String(open))
  })
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      menu.classList.remove('open')
      ham.setAttribute('aria-expanded', 'false')
    })
  )
}

// highlight the nav pill for the section currently in view
function activeNav() {
  const links = [...document.querySelectorAll('.pills a')]
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]))
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        links.forEach((a) => a.classList.remove('on'))
        const a = byId.get(e.target.id)
        if (a) a.classList.add('on')
      })
    },
    { rootMargin: '-45% 0px -50% 0px' }
  )
  byId.forEach((_, id) => {
    const el = document.getElementById(id)
    if (el) io.observe(el)
  })
}

function revealTiles() {
  const tiles = document.querySelectorAll('.tile')
  if (reduce) {
    tiles.forEach((t) => t.classList.add('in'))
    return
  }
  // stagger within each grid so a row cascades in
  document.querySelectorAll('.bento').forEach((grid) => {
    grid.querySelectorAll(':scope > .tile').forEach((t, i) => {
      t.style.transitionDelay = `${Math.min(i, 8) * 60}ms`
    })
  })
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        const t = e.target
        t.classList.add('in')
        io.unobserve(t)
        // once it's in, drop the delay so hover feels instant
        setTimeout(() => (t.style.transitionDelay = '0ms'), 1200)
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  tiles.forEach((t) => io.observe(t))

  // failsafe: never leave tiles that are already on screen invisible
  setTimeout(() => {
    tiles.forEach((t) => {
      const r = t.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) t.classList.add('in')
    })
  }, 1500)
}

function spotlight() {
  document.querySelectorAll('.tile').forEach((t) =>
    t.addEventListener('pointermove', (e) => {
      const r = t.getBoundingClientRect()
      t.style.setProperty('--x', `${e.clientX - r.left}px`)
      t.style.setProperty('--y', `${e.clientY - r.top}px`)
    })
  )
}

function rotateRoles() {
  const roles = [...document.querySelectorAll('.roles b')]
  if (roles.length < 2 || reduce) return
  let k = 0
  setInterval(() => {
    const cur = roles[k]
    k = (k + 1) % roles.length
    cur.classList.remove('on')
    cur.classList.add('out')
    roles[k].classList.remove('out')
    roles[k].classList.add('on')
    setTimeout(() => cur.classList.remove('out'), 650)
  }, 2600)
}

function clock() {
  const el = document.getElementById('clock')
  if (!el) return
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-SG', {
      timeZone: 'Asia/Singapore',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
  tick()
  setInterval(tick, 1000)
}

// numbers count up the first time they're seen (they start at the real value
// in the HTML, so nothing is wrong without JS)
function countUp() {
  if (reduce) return
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        const el = e.target
        const to = Number(el.dataset.to)
        const suffix = el.dataset.suffix || ''
        const t0 = performance.now()
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 1100)
          el.textContent = Math.max(1, Math.round(to * (1 - Math.pow(1 - k, 3)))) + suffix
          if (k < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
    },
    { threshold: 0.6 }
  )
  document.querySelectorAll('[data-to]').forEach((el) => io.observe(el))
}

// the "ask my AI" tile types sample questions and opens the real chatbot
function askTile() {
  const tile = document.getElementById('askTile')
  const el = document.getElementById('typer')
  if (!tile || !el) return
  const open = () => {
    const t = document.getElementById('chatbotToggle')
    const panel = document.getElementById('chatbotPanel')
    if (t && panel && !panel.classList.contains('open')) t.click()
  }
  tile.addEventListener('click', open)
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  })

  const qs = [
    'What has Khine shipped to production?',
    'Is Khine open to S Pass roles?',
    'Tell me about Code-to-Cloud',
    'Which AWS services does Khine use?',
  ]
  if (reduce) {
    el.textContent = qs[0]
    return
  }
  let qi = 0
  let ci = 0
  let deleting = false
  const type = () => {
    const q = qs[qi]
    el.textContent = q.slice(0, ci)
    if (!deleting && ci < q.length) ci++
    else if (!deleting) {
      deleting = true
      return setTimeout(type, 1600)
    } else if (ci > 0) ci--
    else {
      deleting = false
      qi = (qi + 1) % qs.length
    }
    setTimeout(type, deleting ? 25 : 55)
  }
  type()
}

function certTabs() {
  const btns = document.querySelectorAll('.cert-tab-btn')
  btns.forEach((btn) =>
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab
      btns.forEach((b) => b.classList.toggle('active', b === btn))
      document
        .querySelectorAll('.cert-tab-pane')
        .forEach((p) => p.classList.toggle('active', p.dataset.tab === tab))
    })
  )
}

// photo + diploma tiles open full-size in the lightbox (modal.js)
function zoomTiles() {
  document.querySelectorAll('[data-zoom]').forEach((t) => {
    const img = t.querySelector('img')
    const go = () => typeof window.openModal === 'function' && window.openModal(img.src, img.alt)
    t.addEventListener('click', go)
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        go()
      }
    })
  })
}

function owlEyes() {
  const pet = document.getElementById('owlPet')
  if (!pet || reduce) return
  const svg = pet.querySelector('svg.owl')
  const pupils = pet.querySelectorAll('.owl-eyes circle[fill="currentColor"]')
  let x = 0
  let y = 0
  let frame = 0
  const look = () => {
    frame = 0
    if (pet.hidden) return
    const r = svg.getBoundingClientRect()
    const dx = x - (r.left + r.width / 2)
    const dy = y - (r.top + r.height * 0.36)
    const d = Math.hypot(dx, dy) || 1
    const reach = Math.min(2.6, d / 60)
    let tx = (dx / d) * reach
    const ty = (dy / d) * reach
    if (pet.classList.contains('face-left')) tx = -tx
    pupils.forEach((p) => (p.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`))
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

function owlGuide() {
  const lines = {
    about: "that's khine — backend at heart, full-stack in practice",
    experience: 'a whole year shipping to prod',
    projects: 'ooh, the good stuff. try the filters!',
    stack: 'everything khine has actually shipped with',
    certifications: 'psst, the list scrolls. more below ↓',
    contact: 'say hi! khine replies within 24h',
    education: 'pre-med → IT. plot twist',
  }
  const said = new Set()
  let last = 0
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || said.has(e.target.id)) return
        if (typeof window.owlSay !== 'function' || Date.now() - last < 5000) return
        if (window.owlSay(lines[e.target.id], 4200)) {
          said.add(e.target.id)
          last = Date.now()
        }
      })
    },
    { threshold: 0.25 }
  )
  Object.keys(lines).forEach((id) => {
    const el = document.getElementById(id)
    if (el) io.observe(el)
  })
}
