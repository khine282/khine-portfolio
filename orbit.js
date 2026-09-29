// ═══════════════════════════════════════════════════════════════════
// PROJECT ORBIT
// Projects are planets circling a ring, coloured by category (the filter
// buttons double as the key); the selected one swells and drags a comet
// tail. Hovering one plays its demo in the middle with a short blurb. "Details" slides the full write-up over the demo,
// "Expand" opens the demo full-size. The <article class="orbit-proj">
// list in index.html is the source — without JS it shows as a plain list.
// ═══════════════════════════════════════════════════════════════════

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const small = matchMedia('(max-width: 760px)')

const lockSvg =
  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>'
const expandSvg =
  '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 1h4v4M5 11H1V7M11 1 7 5M1 11l4-4"/></svg>'

// planet colour per category — the filter buttons get the same dots
const PLANET = {
  internship: 'var(--mint)',
  hackathon: 'var(--yellow)',
  'testing-qa': 'var(--lime)',
  llm: 'var(--lilac)',
  'computer-vision': 'var(--pink)',
  'cloud-architecture': 'var(--sky)',
  'ecommerce-cms': 'var(--orange)',
}
const TAIL = 14 // dots in the comet tail

const CYCLE_MS = 5000
const SPIN = 0.00006 // radians per ms — one lap ≈ 105s

export function initOrbit() {
  const orbit = document.getElementById('projectOrbit')
  if (!orbit) return

  const projects = [...orbit.querySelectorAll('.orbit-proj')].map((el) => ({
    name: el.querySelector('h3').textContent,
    badge: el.querySelector('.badge').textContent,
    one: el.querySelector('.orbit-one').innerHTML,
    desc: el.querySelector('.orbit-desc').innerHTML,
    chips: el.querySelector('.orbit-chips').innerHTML,
    links: el.querySelector('.orbit-links').innerHTML,
    category: el.dataset.category,
    video: el.dataset.video,
    image: el.dataset.image,
    priv: el.hasAttribute('data-private'),
  }))

  orbit.insertAdjacentHTML(
    'beforeend',
    `<div class="orbit-ring" aria-hidden="true"></div>
     <div class="orbit-ring inner" aria-hidden="true"></div>
     <svg class="orbit-tail" aria-hidden="true">${'<circle/>'.repeat(TAIL)}</svg>
     <div class="orbit-names" role="tablist" aria-label="Projects">
       ${projects
         .map(
           (p, i) =>
             `<button class="orbit-name" role="tab" data-i="${i}" style="--c:${PLANET[p.category] || 'var(--orange)'}"><span class="orbit-planet"></span><span class="orbit-label">${p.name}</span></button>`
         )
         .join('')}
     </div>
     <div class="orbit-core">
       <div class="orbit-screen">
         <span class="orbit-count"></span>
         <button class="orbit-expand" type="button">${expandSvg}Expand</button>
         <div class="orbit-detail" aria-live="polite"></div>
       </div>
       <div class="orbit-info"></div>
     </div>`
  )
  orbit.classList.add('orbit-ready')

  const names = [...orbit.querySelectorAll('.orbit-name')]
  const tail = orbit.querySelector('.orbit-tail')
  const tailDots = [...tail.children]
  const screen = orbit.querySelector('.orbit-screen')
  const detail = orbit.querySelector('.orbit-detail')
  const info = orbit.querySelector('.orbit-info')
  const count = orbit.querySelector('.orbit-count')
  const expand = orbit.querySelector('.orbit-expand')
  const lb = buildLightbox()

  let current = -1
  let hovering = false
  let visible = false
  let active = projects.map(() => true) // filter state
  let pinned = false // no demo to show, so the write-up stays open instead
  const paused = () => hovering || lb.isOpen() || (detail.classList.contains('on') && !pinned)

  // ── spin the names around the ring ──
  let angle = -Math.PI / 2
  let last = performance.now()
  function place(now) {
    if (visible && !paused() && !reduce) angle += (now - last) * SPIN
    last = now
    if (!small.matches) {
      const w = orbit.offsetWidth
      const r = w * 0.43
      names.forEach((el, i) => {
        const a = angle + (i / names.length) * Math.PI * 2
        el.style.transform = `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)`
        el.classList.toggle('left', Math.cos(a) < -0.15) // label on the outside of the ring
      })
      // comet tail trails the selected planet
      if (current >= 0) {
        tail.setAttribute('viewBox', `${-w / 2} ${-w / 2} ${w} ${w}`)
        tail.style.setProperty('--c', names[current].style.getPropertyValue('--c'))
        const a0 = angle + (current / names.length) * Math.PI * 2
        tailDots.forEach((d, k) => {
          const a = a0 - (k + 1) * 0.035
          const f = 1 - k / TAIL
          d.setAttribute('cx', Math.cos(a) * r)
          d.setAttribute('cy', Math.sin(a) * r)
          d.setAttribute('r', w * 0.013 * f)
          d.setAttribute('opacity', 0.55 * f)
        })
      }
    } else {
      names.forEach((el) => (el.style.transform = ''))
    }
    requestAnimationFrame(place)
  }
  requestAnimationFrame(place)

  function mediaEl(p) {
    const wrap = document.createElement('div')
    wrap.className = 'orbit-media'
    if (p.video) {
      const v = Object.assign(document.createElement('video'), { src: p.video, muted: true, loop: true, playsInline: true })
      v.setAttribute('aria-label', `${p.name} demo`)
      wrap.append(v)
      if (visible) v.play().catch(() => {})
    } else if (p.image) {
      wrap.innerHTML = `<img src="${p.image}" alt="${p.name} screenshot">`
    } else if (p.priv) {
      wrap.innerHTML = `<div class="orbit-ph private"><span class="orbit-lock">${lockSvg} Private codebase</span><strong>${p.name}</strong><small>Client work · no public demo</small></div>`
    } else {
      wrap.innerHTML = `<div class="orbit-ph"><strong>${p.name}</strong><small>No demo recording</small></div>`
    }
    return wrap
  }

  // ── show one project in the middle ──
  function show(i) {
    if (i === current) return
    current = i
    const p = projects[i]
    names.forEach((n, j) => {
      n.classList.toggle('on', j === i)
      n.setAttribute('aria-selected', String(j === i))
    })
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`
    expand.hidden = !(p.video || p.image)
    pinned = false
    hideDetail()

    const old = [...screen.querySelectorAll('.orbit-media')]
    const el = mediaEl(p)
    el.classList.add('fade')
    screen.insertBefore(el, detail)
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('fade')))
    old.forEach((o) => {
      o.classList.add('fade')
      o.querySelector('video')?.pause()
      setTimeout(() => o.remove(), 400)
    })

    detail.innerHTML = `${p.priv ? `<span class="orbit-detail-lock">${lockSvg} Private codebase</span>` : ''}<h4>About ${p.name}</h4><p>${p.desc}</p><div class="orbit-chips">${p.chips}</div>`
    pinned = !(p.video || p.image)
    if (pinned) detail.classList.add('on')
    info.classList.add('fade')
    setTimeout(() => {
      info.innerHTML = `<span class="orbit-badge">${p.badge}</span><h3>${p.name}</h3><p>${p.one}</p>
        <div class="orbit-links">${pinned ? '' : '<button class="orbit-more" type="button" aria-expanded="false">Details</button>'}${p.links}${
          p.priv ? `<span class="orbit-priv">${lockSvg} Private codebase</span>` : ''
        }</div>`
      info.classList.remove('fade')
      wireMore()
    }, 200)
  }

  const next = () => {
    for (let k = 1; k <= projects.length; k++) {
      const j = (current + k) % projects.length
      if (active[j]) return show(j)
    }
  }

  // ── details: hover the Details tab (or tap it) to slide the full write-up over the demo ──
  let hideT
  const moreBtn = () => info.querySelector('.orbit-more')
  function showDetail() {
    clearTimeout(hideT)
    detail.classList.add('on')
    moreBtn()?.classList.add('on')
    moreBtn()?.setAttribute('aria-expanded', 'true')
  }
  function hideDetail() {
    if (pinned) return
    detail.classList.remove('on')
    moreBtn()?.classList.remove('on')
    moreBtn()?.setAttribute('aria-expanded', 'false')
  }
  function laterHide() {
    clearTimeout(hideT)
    hideT = setTimeout(hideDetail, 250)
  }
  function wireMore() {
    const more = moreBtn()
    if (!more) return
    more.addEventListener('mouseenter', showDetail)
    more.addEventListener('mouseleave', laterHide)
    more.addEventListener('click', () => (detail.classList.contains('on') ? hideDetail() : showDetail()))
  }
  detail.addEventListener('mouseenter', showDetail) // stays open while reading / scrolling it
  detail.addEventListener('mouseleave', laterHide)

  expand.addEventListener('click', () => lb.open(projects[current]))

  names.forEach((n) => {
    const i = +n.dataset.i
    n.addEventListener('mouseenter', () => active[i] && show(i))
    n.addEventListener('click', () => show(i))
  })

  // pause the spin and the auto-cycle while the visitor is inside the orbit
  orbit.addEventListener('mouseenter', () => (hovering = true))
  orbit.addEventListener('mouseleave', () => (hovering = false))
  setInterval(() => visible && !paused() && next(), CYCLE_MS)

  // only play while the section is on screen
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    const v = screen.querySelector('.orbit-media:not(.fade) video')
    if (v) visible ? v.play().catch(() => {}) : v.pause()
  }).observe(orbit)

  // ── filters dim the names that don't match ──
  const btns = document.querySelectorAll('.projects-filter-bar .filter-btn')
  btns.forEach((btn) => {
    const cat = btn.dataset.filter
    const n = cat === 'all' ? projects.length : projects.filter((p) => p.category === cat).length
    btn.insertAdjacentHTML('beforeend', `<span class="filter-count">${n}</span>`)
    if (PLANET[cat]) btn.insertAdjacentHTML('afterbegin', `<span class="filter-dot" style="--c:${PLANET[cat]}"></span>`)
  })
  btns.forEach((btn) =>
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter
      btns.forEach((b) => b.classList.toggle('filter-btn-active', b === btn))
      active = projects.map((p) => cat === 'all' || p.category === cat)
      names.forEach((n, i) => n.classList.toggle('dim', !active[i]))
      if (!active[current]) next()
    })
  )

  show(0)
}

function buildLightbox() {
  const lb = document.createElement('div')
  lb.className = 'orbit-lb'
  lb.setAttribute('role', 'dialog')
  lb.setAttribute('aria-modal', 'true')
  lb.innerHTML = '<button class="orbit-lb-x" type="button" aria-label="Close">✕</button><div class="orbit-lb-box"></div>'
  document.body.append(lb)
  const box = lb.querySelector('.orbit-lb-box')

  const close = () => {
    lb.classList.remove('on')
    box.innerHTML = ''
  }
  lb.querySelector('.orbit-lb-x').addEventListener('click', close)
  lb.addEventListener('click', (e) => e.target === lb && close())
  addEventListener('keydown', (e) => e.key === 'Escape' && close())

  return {
    isOpen: () => lb.classList.contains('on'),
    open(p) {
      box.innerHTML =
        (p.video
          ? `<video src="${p.video}" controls autoplay loop playsinline></video>`
          : `<img src="${p.image}" alt="${p.name} screenshot">`) +
        `<div class="orbit-lb-cap">${p.name}<span>Esc to close</span></div>`
      lb.classList.add('on')
      lb.querySelector('.orbit-lb-x').focus()
    },
  }
}
