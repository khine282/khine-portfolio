// contact.js
import emailjs from '@emailjs/browser'

export function initializeContact() {
  emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

  const contactForm = document.getElementById('contactForm')
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit)
    initQuickStarts(contactForm)
  }
}

// one-click starters: fill the message with a ready-made note and select
// the first [placeholder] so the sender just types over it
const STARTERS = {
  role: "Hi Khine, I'm hiring for a [role title] position at [company] in Singapore. Your background looks like a good fit — are you open to a quick chat this week?",
  call: "Hi Khine, I'd like to set up a 15-minute call about an opportunity. I'm free on [day / time] — does that work for you?",
  project: "Hi Khine, I have a project that needs [testing / Java backend / AI work], roughly [timeline]. Could you share your availability?",
  hi: "Hi Khine, I came across your portfolio and wanted to say hello!",
}

function initQuickStarts(form) {
  const box = document.getElementById('message')
  const btns = form.querySelectorAll('.quick-btn')
  let filled = ''
  btns.forEach((btn) =>
    btn.addEventListener('click', () => {
      // never overwrite something the sender wrote themselves
      if (box.value.trim() && box.value !== filled && !confirm('Replace your message with this starter?')) return
      filled = box.value = STARTERS[btn.dataset.quick]
      btns.forEach((b) => b.classList.toggle('on', b === btn))
      box.focus()
      const start = filled.indexOf('[')
      if (start >= 0) box.setSelectionRange(start, filled.indexOf(']', start) + 1)
      else box.setSelectionRange(filled.length, filled.length)
    })
  )
  form.addEventListener('reset', () => {
    filled = ''
    btns.forEach((b) => b.classList.remove('on'))
  })
}

async function handleFormSubmit(e) {
  e.preventDefault()
  const btn = document.getElementById('submitBtn')
  const status = document.getElementById('statusMessage')
  const formData = {
    from_name: document.getElementById('from_name').value,
    from_email: document.getElementById('from_email').value,
    message: document.getElementById('message').value
  }
  btn.textContent = 'Sending...'
  btn.disabled = true
  try {
    // Send ONLY to admin (your email)
    await emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN, formData)
    
    status.style.display = 'block'
    status.style.background = 'rgba(200,255,0,0.08)'
    status.style.color = 'var(--lime)'
    status.style.border = '1px solid rgba(200,255,0,0.2)'
    status.textContent = "✓ Message sent! I'll get back to you soon."
    document.getElementById('contactForm').reset()
  } catch (err) {
    status.style.display = 'block'
    status.style.background = 'rgba(255,92,92,0.08)'
    status.style.color = 'var(--coral)'
    status.style.border = '1px solid rgba(255,92,92,0.2)'
    status.textContent = '✗ Failed to send. Try emailing directly.'
    console.error('EmailJS error:', err)
  }
  btn.textContent = 'Send message →'
  btn.disabled = false
}