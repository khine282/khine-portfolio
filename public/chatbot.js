const CHATBOT_API_URL = "https://3vawa7e4o7.execute-api.ap-southeast-1.amazonaws.com/chat";

const toggle = document.getElementById('chatbotToggle');
const panel = document.getElementById('chatbotPanel');
const closeBtn = document.getElementById('chatbotClose');
const form = document.getElementById('chatbotForm');
const input = document.getElementById('chatbotInput');
const messagesEl = document.getElementById('chatbotMessages');
const sendBtn = document.getElementById('chatbotSend');
const teaser = document.getElementById('chatbotTeaser');
const teaserClose = document.getElementById('chatbotTeaserClose');

let history = [];
let waiting = false;

let teaserDismissed = false;
try { teaserDismissed = localStorage.getItem('chatbotTeaserDismissed') === '1'; } catch (e) {}

// keep the teaser in sync: visible whenever the chat is closed (unless the
// user permanently dismissed it with the ✕), hidden while the chat is open
function syncTeaser() {
  if (!teaser) return;
  teaser.hidden = teaserDismissed || panel.classList.contains('open');
}

function hideTeaser() {
  if (teaser) teaser.hidden = true;
}

if (document.readyState === 'complete') syncTeaser();
else window.addEventListener('load', syncTeaser);

if (teaser) {
  teaser.addEventListener('click', (e) => {
    if (e.target === teaserClose) return;
    hideTeaser();
    if (!panel.classList.contains('open')) toggle.click();
  });
}

if (teaserClose) {
  teaserClose.addEventListener('click', (e) => {
    e.stopPropagation();
    teaserDismissed = true;
    hideTeaser();
    try { localStorage.setItem('chatbotTeaserDismissed', '1'); } catch (err) {}
  });
}

function addMessage(role, text) {
  const el = document.createElement('div');
  el.className = `chatbot-msg chatbot-msg-${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function setWaiting(state) {
  waiting = state;
  sendBtn.disabled = state;
  input.disabled = state;
}

toggle.addEventListener('click', () => {
  const isOpen = panel.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  syncTeaser();
  if (isOpen) {
    input.focus();
    if (messagesEl.children.length === 0) {
      addMessage('bot', "Hi! I'm Khine's portfolio assistant. Ask me about her projects, skills, or experience.");
    }
  }
});

closeBtn.addEventListener('click', () => {
  panel.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  syncTeaser();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message || waiting) return;

  addMessage('user', message);
  input.value = '';
  setWaiting(true);
  const typingEl = addMessage('bot', 'Typing…');
  typingEl.classList.add('chatbot-typing');

  try {
    const res = await fetch(CHATBOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    const data = await res.json();

    typingEl.remove();

    if (!res.ok) {
      addMessage('bot', data.error || "Something went wrong. Please try again.");
      return;
    }

    addMessage('bot', data.reply);
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: data.reply });
    if (history.length > 12) history = history.slice(-12);

  } catch (err) {
    typingEl.remove();
    addMessage('bot', "Couldn't reach the server. Please try again in a moment.");
  } finally {
    setWaiting(false);
    input.focus();
  }
});
