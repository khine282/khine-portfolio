// contact.js
import emailjs from '@emailjs/browser'

export function initializeContact() {
  emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

  const contactForm = document.getElementById('contactForm')
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit)
  }
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
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN,
      formData
    )
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID_USER,
      formData
    )

    status.style.display = 'block'
    status.style.background = 'rgba(200,255,0,0.08)'
    status.style.color = 'var(--lime)'
    status.style.border = '1px solid rgba(200,255,0,0.2)'
    status.textContent = '✓ Email sent! You\'ll receive a confirmation at ' + formData.from_email
    document.getElementById('contactForm').reset()
  } catch (err) {
    status.style.display = 'block'
    status.style.background = 'rgba(255,92,92,0.08)'
    status.style.color = 'var(--coral)'
    status.style.border = '1px solid rgba(255,92,92,0.2)'
    status.textContent = '✗ Failed to send. Try emailing directly.'
    console.error('EmailJS error:', err)
  }

  btn.textContent = 'Send Message →'
  btn.disabled = false
}