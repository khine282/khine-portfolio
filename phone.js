// ═══════════════════════════════════════════════════════════════════
// PHONE EXTRAS
// On phones (bento.css, ≤620px) the page turns into plain lists. This
// adds the few taps that layout needs: "Show all" for projects and
// credentials, "Highlights +" on experience (listed newest first), and
// the "Send a message" button that opens the contact form.
// Everything here is hidden on bigger screens by .phone-only.
// ═══════════════════════════════════════════════════════════════════

export function initPhone() {
  showAll(document.querySelector('.orbit-list'), '.orbit-proj', 'projects', document.getElementById('projectOrbit'))
  showAll(document.querySelector('.cert-tab-pane[data-tab="all"] .cert-scroll-container'), '.cert-tab-item', '')
  experience()
  messageToggle()
}

// first four only, then a button for the rest
function showAll(list, itemSel, noun, after = list) {
  if (!list || !after) return
  const n = list.querySelectorAll(itemSel).length
  if (n <= 4) return
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'show-all phone-only'
  btn.textContent = `Show all ${n}${noun ? ' ' + noun : ''}`
  btn.addEventListener('click', () => list.classList.add('show-all'))
  after.after(btn)
}

function experience() {
  const list = document.querySelector('.track-list')
  if (!list) return
  const items = [...list.children]
  const rank = [...items].sort((a, b) => b.dataset.start.localeCompare(a.dataset.start))
  items.forEach((li) => {
    li.style.order = rank.indexOf(li)
    if (li.dataset.kind === 'work' && !li.dataset.end) li.classList.add('now')
    if (li.dataset.kind !== 'work' && li.dataset.kind !== 'study') return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'hl-toggle phone-only'
    btn.textContent = 'Highlights +'
    btn.setAttribute('aria-expanded', 'false')
    btn.addEventListener('click', () => {
      const open = li.classList.toggle('open')
      btn.setAttribute('aria-expanded', String(open))
      btn.textContent = open ? 'Highlights −' : 'Highlights +'
    })
    li.querySelector('.track-org').after(btn)
  })
}

function messageToggle() {
  const btn = document.querySelector('.msg-toggle')
  const box = document.querySelector('.contact')
  if (!btn || !box) return
  btn.addEventListener('click', () => {
    const open = box.classList.toggle('msg-open')
    btn.setAttribute('aria-expanded', String(open))
    btn.textContent = open ? 'Close' : 'Send a message'
    if (open) document.getElementById('from_name')?.focus()
  })
}
