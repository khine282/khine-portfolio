// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// Hamburger nav
const ham = document.getElementById('navHam');
const mob = document.getElementById('navMobile');
ham.addEventListener('click', () => mob.classList.toggle('open'));
function closeMobile() { mob.classList.remove('open'); }

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Auto-stagger: give each .reveal a delay based on its position among
// sibling .reveal elements, so grids/rows cascade in instead of popping
// together. Elements with an explicit .reveal-delay-* class keep theirs.
if (!prefersReducedMotion) {
  const grouped = new Map();
  reveals.forEach(el => {
    if (/reveal-delay-/.test(el.className)) return;
    const parent = el.parentElement;
    const idx = (grouped.get(parent) || 0);
    grouped.set(parent, idx + 1);
    if (idx > 0) el.style.transitionDelay = Math.min(idx * 60, 300) + 'ms';
  });
}

// Hold the reveal animations until the preloader has cleared, so the
// entrance actually plays instead of finishing behind the loading screen.
let revealsStarted = false;
function startReveals() {
  if (revealsStarted) return;
  revealsStarted = true;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => observer.observe(el));

  // Trigger hero reveals immediately (CSS delay classes handle the cascade)
  document.querySelectorAll('#hero .reveal').forEach(el => {
    setTimeout(() => el.classList.add('visible'), 120);
  });
}

if (window.__preloaderDone) {
  startReveals();
} else {
  document.addEventListener('preloader:done', startReveals, { once: true });
  setTimeout(startReveals, 5000); // failsafe if the preloader never signals
}

// Skill bars
const skillSection = document.getElementById('skills');
if (skillSection) {
  let barsTriggered = false;
  const skillObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !barsTriggered) {
      barsTriggered = true;
      document.querySelectorAll('.skill-fill').forEach((el, i) => {
        const w = parseFloat(el.getAttribute('data-w'));
        setTimeout(() => { el.style.transform = `scaleX(${w})`; }, 150 + i * 100);
      });
    }
  }, { threshold: 0.2 });
  skillObs.observe(skillSection);
}

// Nav scroll style
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    nav.style.borderBottomColor = 'rgba(255,255,255,0.1)';
  } else {
    nav.style.borderBottomColor = 'rgba(255,255,255,0.07)';
  }
});

// Tech Stack tab switching
document.querySelectorAll('.stack-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.stack-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.stack-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.stack-panel[data-panel="${target}"]`).classList.add('active');
  });
});

document.querySelectorAll('.cert-tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');
    document.querySelectorAll('.cert-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.cert-tab-pane').forEach(pane => pane.classList.remove('active'));
    button.classList.add('active');
    document.querySelector(`.cert-tab-pane[data-tab="${tabName}"]`).classList.add('active');
  });
});

// Scroll progress bar
const progressBar = document.getElementById('navProgressBar');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
});

const rotators = document.querySelectorAll('.title-rotator');
if (rotators.length > 1) {
  let current = 0;
  setInterval(() => {
    const next = (current + 1) % rotators.length;
    rotators[current].classList.remove('active');
    rotators[current].classList.add('exit');
    rotators[next].classList.add('active');
    setTimeout(() => rotators[current].classList.remove('exit'), 500);
    current = next;
  }, 2800);
}