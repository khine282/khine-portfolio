import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Light scroll easing — just takes the "stepping" edge off the native
// wheel, without the long glide of full momentum scrolling. Touch stays
// native. Disabled entirely when the visitor asks for reduced motion.
export function initSmoothScroll() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return

  const lenis = new Lenis({
    lerp: 0.18, // higher = snappier / closer to native (0.1 ≈ glidey, 0.2 ≈ tight)
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  })

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  // Let nested scrollable panels handle their own wheel events.
  document
    .querySelectorAll('.cert-scroll-container, .chatbot-messages')
    .forEach((el) => el.setAttribute('data-lenis-prevent', ''))

  // Route in-page anchor links through Lenis so jumps are eased too,
  // and land clear of the fixed nav.
  const navH =
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 76

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href')
      if (!hash || hash === '#') return
      const target = document.querySelector(hash)
      if (!target) return
      e.preventDefault()
      // Sections already carry their own top padding before the heading,
      // so subtract it out — otherwise the nav offset stacks on top of
      // that padding and lands well below the heading.
      const targetPadTop = parseFloat(getComputedStyle(target).paddingTop) || 0
      lenis.scrollTo(target, { offset: targetPadTop - (navH + 12), duration: 0.8 })
    })
  })

  window.lenis = lenis
}
