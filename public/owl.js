// Owl mascot. On desktop it roams the lower viewport and can be dragged;
// on phones / reduced-motion it docks in a corner. Hovering shows a
// "click me · drag me" label; click/tap cycles through Khine's story + a
// few tips. The ✕ sends it away for this visit — a 🦉 button then shows in
// the nav bar to bring it back (reload / owlReset() also work).
(function () {
  var pet = document.getElementById('owlPet');
  if (!pet) return;

  var bubble = document.getElementById('owlPetBubble');
  var dismissBtn = document.getElementById('owlPetDismiss');
  var navBtn = document.getElementById('owlRestoreNav');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia('(max-width: 640px)').matches;
  // docked = sits in the corner, never roams (still tappable + draggable)
  var docked = small || reduce;

  function isHidden() {
    try { return sessionStorage.getItem('owlPetHidden') === '1'; } catch (e) { return false; }
  }
  function setHidden(v) {
    try {
      if (v) sessionStorage.setItem('owlPetHidden', '1');
      else sessionStorage.removeItem('owlPetHidden');
    } catch (e) {}
  }

  window.owlReset = function () { setHidden(false); location.reload(); };

  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }

  var DOCK_X = 12;
  function dockY() { return vh() - (docked ? 74 : 150); }

  var x = docked ? DOCK_X : 28;
  var y = dockY();
  var paused = false;
  var roamTimer = null;
  var bubbleTimer = null;
  var landTimer = null;

  function place() {
    pet.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  // roam the lower ~45% of the viewport so it stays clear of reading area
  function roam() {
    if (paused || docked) return;
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
    if (docked) return;
    clearTimeout(roamTimer);
    roamTimer = setTimeout(function () {
      roam();
      scheduleRoam();
    }, 4500 + Math.random() * 4500);
  }

  // stop an in-progress glide so the owl (and its ✕) sits still under the cursor
  function freeze() {
    var t = getComputedStyle(pet).transform;
    if (t && t !== 'none') {
      try {
        var m = new DOMMatrixReadOnly(t);
        x = m.m41;
        y = m.m42;
      } catch (e) {}
    }
    pet.style.transition = 'none';
    place();
    void pet.offsetWidth;            // flush
    pet.style.transition = '';
    pet.classList.remove('is-flying');
    clearTimeout(landTimer);
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
  var LABEL = docked ? "tap me 🦉" : "click me · drag me 🦉";

  function hideBubble() {
    if (bubble) bubble.hidden = true;
  }

  function showBubble(text, ms) {
    if (!bubble || pet.hidden) return;
    bubble.textContent = text;
    bubble.hidden = false;
    clearTimeout(bubbleTimer);
    if (ms) bubbleTimer = setTimeout(hideBubble, ms);
  }

  function showLabel(ms) { showBubble(LABEL, ms || 0); }

  function nextTip() {
    showBubble(tips[tipIdx % tips.length], 4500);
    tipIdx++;
  }

  pet.addEventListener('mouseenter', function () {
    if (dragging || docked) return;
    paused = true;
    clearTimeout(roamTimer);
    freeze();
    pet.classList.add('is-curious');
    showLabel();                     // stays until mouseleave
  });

  pet.addEventListener('mouseleave', function () {
    if (dragging || docked) return;
    paused = false;
    pet.classList.remove('is-curious');
    if (bubble && bubble.textContent === LABEL) hideBubble();
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
    if (!moved) { nextTip(); }        // it was a tap, not a drag
    if (docked) return;
    if (moved) {
      clearTimeout(roamTimer);
      roamTimer = setTimeout(function () { roam(); scheduleRoam(); }, 9000 + Math.random() * 6000);
    } else {
      scheduleRoam();
    }
  }

  pet.addEventListener('pointerup', endDrag);
  pet.addEventListener('pointercancel', endDrag);

  function showNavBtn() { if (navBtn) navBtn.hidden = false; }
  function hideNavBtn() { if (navBtn) navBtn.hidden = true; }

  // ── dismiss ──
  function dismiss() {
    setHidden(true);
    clearTimeout(roamTimer);
    clearTimeout(bubbleTimer);
    clearTimeout(landTimer);
    hideBubble();
    pet.classList.add('is-leaving');
    setTimeout(function () {
      pet.hidden = true;
      pet.classList.remove('is-leaving', 'is-flying', 'is-curious', 'face-left');
    }, 460);
    showNavBtn();
  }

  dismissBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    dismiss();
  });
  dismissBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

  function enter() {
    hideNavBtn();
    x = docked ? DOCK_X : 28;
    y = dockY();
    pet.hidden = false;
    pet.classList.toggle('is-docked', docked);
    place();
    // show the label once on arrival so it's noticed, then let it fade
    setTimeout(function () { showLabel(docked ? 5000 : 3500); }, 500);
    scheduleRoam();
  }

  if (navBtn) {
    navBtn.addEventListener('click', function () {
      setHidden(false);
      enter();
    });
  }

  window.addEventListener('resize', function () {
    if (docked) { x = DOCK_X; y = dockY(); }
    else { x = Math.min(x, vw() - 88); y = Math.min(y, vh() - 88); }
    place();
  });

  // ── boot ──
  if (isHidden()) { showNavBtn(); return; }

  if (window.__preloaderDone) {
    setTimeout(enter, 500);
  } else {
    document.addEventListener('preloader:done', function () {
      setTimeout(enter, 500);
    }, { once: true });
    setTimeout(function () { if (pet.hidden) enter(); }, 6000); // failsafe
  }
})();
