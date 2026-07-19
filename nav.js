// Hamburger nav
const ham = document.getElementById('navHam');
const mob = document.getElementById('navMobile');
ham.addEventListener('click', () => mob.classList.toggle('open'));
function closeMobile() { mob.classList.remove('open'); }

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => observer.observe(el));

// Trigger hero reveals immediately
document.querySelectorAll('#hero .reveal').forEach(el => {
  setTimeout(() => el.classList.add('visible'), 100);
});

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