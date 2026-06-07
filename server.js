// require('dotenv').config();
// const express = require('express');
// const path = require('path');
// const { Resend } = require('resend');

// const app = express();
// const PORT = process.env.PORT || 3000;
// const resend = new Resend(process.env.RESEND_API_KEY);

// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // Contact form endpoint
// app.post('/api/contact', async (req, res) => {
//   const { name, email, message } = req.body;

//   if (!name || !email || !message) {
//     return res.status(400).json({ error: 'All fields required.' });
//   }

//   try {
//     await resend.emails.send({
//       from: 'Portfolio <onboarding@resend.dev>',
//       to: 'khinezarthwe282@gmail.com',
//       subject: `Portfolio message from ${name}`,
//       html: `
//         <div style="font-family:sans-serif; max-width:500px;">
//           <h2 style="color:#111;">New message from your portfolio</h2>
//           <p><strong>Name:</strong> ${name}</p>
//           <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
//           <p><strong>Message:</strong></p>
//           <p style="background:#f5f5f5; padding:16px; border-radius:8px;">${message.replace(/\n/g, '<br>')}</p>
//         </div>
//       `
//     });
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to send. Try again.' });
//   }
// });

// app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));

// app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));




/** from html file - initial email script */


// // Contact form
    // document.getElementById('contactForm').addEventListener('submit', async (e) => {
    //   e.preventDefault();
    //   const btn = document.getElementById('cf-btn');
    //   const status = document.getElementById('cf-status');

    //   btn.textContent = 'Sending...';
    //   btn.disabled = true;
    //   btn.style.opacity = '0.7';

    //   try {
    //     const res = await fetch('/api/contact', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({
    //         name: document.getElementById('cf-name').value,
    //         email: document.getElementById('cf-email').value,
    //         message: document.getElementById('cf-message').value,
    //       })
    //     });

    //     const data = await res.json();
    //     status.style.display = 'block';

    //     if (data.success) {
    //       status.style.background = 'rgba(200,255,0,0.08)';
    //       status.style.color = 'var(--lime)';
    //       status.style.border = '1px solid rgba(200,255,0,0.2)';
    //       status.textContent = '✓ Message sent! I\'ll get back to you within 24h.';
    //       document.getElementById('contactForm').reset();
    //     } else {
    //       status.style.background = 'rgba(255,92,92,0.08)';
    //       status.style.color = 'var(--coral)';
    //       status.style.border = '1px solid rgba(255,92,92,0.2)';
    //       status.textContent = '✗ ' + (data.error || 'Something went wrong. Try emailing directly.');
    //     }
    //   } catch (err) {
    //     status.style.display = 'block';
    //     status.style.background = 'rgba(255,92,92,0.08)';
    //     status.style.color = 'var(--coral)';
    //     status.style.border = '1px solid rgba(255,92,92,0.2)';
    //     status.textContent = '✗ Network error. Try emailing khinezarthwe282@gmail.com directly.';
    //   }

    //   btn.textContent = 'Send Message →';
    //   btn.disabled = false;
    //   btn.style.opacity = '1';
    // });