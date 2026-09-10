// Roaming owl mascot. Small, slow-moving, dismissible. Hidden on phones,
// for reduced-motion users, and once the visitor has sent it away.
(function () {
  var pet = document.getElementById('owlPet');
  if (!pet) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 640px)').matches;
  var dismissed = false;
  try { dismissed = localStorage.getItem('owlPetDismissed') === '1'; } catch (e) {}

  // let this be undone from the console: owlReset()
  window.owlReset = function () {
    try { localStorage.removeItem('owlPetDismissed'); } catch (e) {}
    location.reload();
  };

  if (small) { console.info('[owl] hidden: viewport ≤ 640px'); return; }
  if (dismissed) { console.info('[owl] hidden: dismissed earlier — run owlReset() to bring it back'); return; }
  // reduced-motion visitors still get the owl, just standing still (no roaming)

  var bubble = document.getElementById('owlPetBubble');
  var dismissBtn = document.getElementById('owlPetDismiss');

  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }

  var x = 28;
  var y = vh() - 150;
  var paused = false;
  var roamTimer = null;
  var bubbleTimer = null;
  var landTimer = null;

  function place() {
    pet.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  // roam the lower ~45% of the viewport so it stays clear of reading area
  function roam() {
    if (paused) return;
    var nx = 20 + Math.random() * (vw() - 90);
    var minY = Math.max(70, vh() * 0.5);
    var ny = Math.min(minY + Math.random() * (vh() * 0.4), vh() - 88);
    pet.classList.toggle('face-left', nx < x);
    x = nx;
    y = ny;
    pet.classList.add('is-flying');
    place();
    clearTimeout(landTimer);
    landTimer = setTimeout(function () { pet.classList.remove('is-flying'); }, 1650);
  }

  function scheduleRoam() {
    clearTimeout(roamTimer);
    roamTimer = setTimeout(function () {
      roam();
      scheduleRoam();
    }, 4500 + Math.random() * 4500);
  }

  // clicking the owl cycles through these — Khine's story first (bite-sized),
  // then a few practical pointers, then it loops
  var tips = [
    "fun fact: i was pre-med back in myanmar 🩺",
    "2nd year i knew i wanted out — picked tech, like every student does 💻",
    "so i packed up and moved to singapore for it 🇸🇬",
    "somehow thrived here as an intl student ✨",
    "now? turns out cloud dev is the part i'm actually passionate about ☁️",
    "also i'm a leo, if that explains anything ♌",
    "psst — hover khine's photo up top, it goes full-size 👆",
    "the projects section is the good stuff, keep scrolling",
    "wanna know more? the chat bubble's got you",
    "the certifications list scrolls — more hiding down there",
    "try the theme toggle up in the nav 🌙"
  ];
  var tipIdx = 0;

  function showBubble(text, ms) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.hidden = false;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.hidden = true; }, ms || 4500);
  }

  function nextTip() {
    showBubble(tips[tipIdx % tips.length]);
    tipIdx++;
  }

  pet.addEventListener('mouseenter', function () {
    if (dragging) return;
    paused = true;
    clearTimeout(roamTimer);
    pet.classList.add('is-curious');
  });

  pet.addEventListener('mouseleave', function () {
    if (dragging) return;
    paused = false;
    pet.classList.remove('is-curious');
    scheduleRoam();
  });

  // ── drag to move it yourself ──
  var dragging = false;
  var moved = false;
  var downX = 0, downY = 0, grabX = 0, grabY = 0;

  pet.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.owl-pet-dismiss') || e.target.closest('.owl-pet-bubble')) return;
    dragging = true;
    moved = false;
    downX = e.clientX;
    downY = e.clientY;
    grabX = e.clientX - x;
    grabY = e.clientY - y;
    paused = true;
    clearTimeout(roamTimer);
    clearTimeout(landTimer);
    pet.classList.remove('is-flying');
    pet.classList.add('is-dragging');
    pet.style.transition = 'none';
    try { pet.setPointerCapture(e.pointerId); } catch (err) {}
  });

  pet.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) moved = true;
    if (moved) pet.classList.toggle('face-left', e.clientX < downX);
    x = Math.max(4, Math.min(e.clientX - grabX, vw() - 56));
    y = Math.max(4, Math.min(e.clientY - grabY, vh() - 64));
    place();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    pet.classList.remove('is-dragging');
    pet.style.transition = '';
    try { pet.releasePointerCapture(e.pointerId); } catch (err) {}
    paused = false;
    if (!moved) {
      nextTip();                    // it was a tap, not a drag
      scheduleRoam();
    } else {
      // dropped somewhere on purpose — let it sit there a good while
      clearTimeout(roamTimer);
      roamTimer = setTimeout(function () { roam(); scheduleRoam(); }, 9000 + Math.random() * 6000);
    }
  }

  pet.addEventListener('pointerup', endDrag);
  pet.addEventListener('pointercancel', endDrag);

  dismissBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    clearTimeout(roamTimer);
    clearTimeout(bubbleTimer);
    pet.classList.add('is-leaving');
    try { localStorage.setItem('owlPetDismissed', '1'); } catch (err) {}
    setTimeout(function () { if (pet.parentNode) pet.parentNode.removeChild(pet); }, 500);
  });

  window.addEventListener('resize', function () {
    x = Math.min(x, vw() - 88);
    y = Math.min(y, vh() - 88);
    place();
  });

  function start() {
    pet.hidden = false;
    place();
    setTimeout(function () {
      showBubble("hey 🦉 click me for facts — or just drag me around", 4200);
    }, 1000);
    if (!reduce) scheduleRoam();   // reduced-motion: stays put, still draggable
  }

  if (window.__preloaderDone) {
    setTimeout(start, 500);
  } else {
    document.addEventListener('preloader:done', function () {
      setTimeout(start, 500);
    }, { once: true });
    setTimeout(function () { if (pet.hidden) start(); }, 6000); // failsafe
  }
})();
