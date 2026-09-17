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

const SUGGESTED_QUESTIONS = [
  "What are Kai's top skills?",
  "Tell me about GlucoSG",
  "Does Kai have AWS experience?",
  "What's Kai's tech stack?",
];

function renderSuggestions() {
  const wrap = document.createElement('div');
  wrap.className = 'chatbot-suggestions';
  wrap.id = 'chatbotSuggestions';
  SUGGESTED_QUESTIONS.forEach((q) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chatbot-chip';
    chip.textContent = q;
    chip.addEventListener('click', () => {
      if (waiting) return;
      wrap.remove();
      sendMessage(q);
    });
    wrap.appendChild(chip);
  });
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// turns light markdown (**bold**, `code`, "- " lists) into safe HTML
function renderMarkdownLite(raw) {
  const lines = escapeHtml(raw).split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const bullet = /^[-•]\s+(.*)/.exec(line.trim());
    if (bullet) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${bullet[1]}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    html += (line.trim() ? line : '<br>') + '<br>';
  }
  if (inList) html += '</ul>';
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return html.replace(/(<br>)+$/, '');
}

// reveals HTML a visible character at a time; tags are copied in whole so
// formatting stays correct mid-animation instead of showing raw markup
function typeMessage(el, html, onDone) {
  const cursor = document.createElement('span');
  cursor.className = 'chatbot-cursor';
  let i = 0;

  function step() {
    if (i >= html.length) {
      el.innerHTML = html;
      if (onDone) onDone();
      return;
    }
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      i = end === -1 ? html.length : end + 1;
    } else {
      i++;
    }
    el.innerHTML = html.slice(0, i);
    el.appendChild(cursor);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    setTimeout(step, 14);
  }
  step();
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
      addMessage('bot', "Hi! I'm Khine's portfolio assistant. Ask me about Kai's projects, skills, or experience.");
      renderSuggestions();
    }
  }
});

closeBtn.addEventListener('click', () => {
  panel.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  syncTeaser();
});

async function sendMessage(message) {
  if (!message || waiting) return;
  const suggestions = document.getElementById('chatbotSuggestions');
  if (suggestions) suggestions.remove();

  addMessage('user', message);
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

    const replyEl = addMessage('bot', '');
    typeMessage(replyEl, renderMarkdownLite(data.reply));

    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: data.reply });
    if (history.length > 12) history = history.slice(-12);
    return;

  } catch (err) {
    typingEl.remove();
    addMessage('bot', "Couldn't reach the server. Please try again in a moment.");
  } finally {
    setWaiting(false);
    input.focus();
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message || waiting) return;
  input.value = '';
  sendMessage(message);
});
