// Turns the tall sections into <details> accordions. The markup is always
// converted; CSS + applyMode() decide how it renders: collapsed & tappable
// at <=768px, fully open with no chrome above that.
(function () {
  var mq = window.matchMedia('(max-width: 768px)');
  var accs = [];

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  // move `nodes` into a <details class="m-acc"> inserted where nodes[0] was
  function wrap(nodes, summary, openByDefault) {
    var arr = [].slice.call(nodes);
    if (!arr.length) return null;
    var d = el('details', 'm-acc');
    d.dataset.openDefault = openByDefault ? '1' : '';
    d.appendChild(summary);
    arr[0].parentNode.insertBefore(d, arr[0]);
    arr.forEach(function (n) { d.appendChild(n); });
    accs.push(d);
    return d;
  }

  function plainSummary(label) {
    var s = el('summary', 'm-acc-sum m-acc-sum-plain');
    var lbl = el('span', 'm-acc-label');
    lbl.textContent = label;
    s.appendChild(lbl);
    return s;
  }

  function build() {
    // EXPERIENCE — one accordion per highlight category
    document.querySelectorAll('#experience .exp-highlight').forEach(function (g, i) {
      if (g.dataset.macc) return;
      g.dataset.macc = '1';
      var cat = g.querySelector('.exp-highlight-cat');
      var lines = g.querySelectorAll('.exp-highlight-line');
      if (!lines.length) return;
      var sum = el('summary', 'exp-highlight-cat m-acc-sum');
      sum.textContent = cat ? cat.textContent : 'More';
      if (cat) cat.remove();
      wrap(lines, sum, false);
    });

    // ABOUT — one accordion per "what I do" row
    document.querySelectorAll('#about .spec-row').forEach(function (row, i) {
      if (row.dataset.macc) return;
      row.dataset.macc = '1';
      var head = row.querySelector('.spec-header');
      var rest = [].slice.call(row.children).filter(function (c) {
        return c !== head;
      });
      if (!rest.length) return;
      var sum = el('summary', 'm-acc-sum');
      if (head) sum.appendChild(head);
      wrap(rest, sum, false);
    });

    // PROJECTS — collapse everything under the title
    document.querySelectorAll('#projects .project-card').forEach(function (card) {
      if (card.dataset.macc) return;
      card.dataset.macc = '1';
      var title = card.querySelector('.project-title');
      if (!title) return;
      var after = [];
      var n = title.nextElementSibling;
      while (n) { after.push(n); n = n.nextElementSibling; }
      if (!after.length) return;
      wrap(after, plainSummary('Details'), false);
    });

    // EDUCATION — collapse the links row
    document.querySelectorAll('#education .edu-card').forEach(function (card) {
      if (card.dataset.macc) return;
      card.dataset.macc = '1';
      var links = card.querySelector('.edu-links');
      if (!links) return;
      wrap([links], plainSummary('Links'), false);
    });

    applyMode();
    if (mq.addEventListener) mq.addEventListener('change', applyMode);
    else if (mq.addListener) mq.addListener(applyMode);
  }

  function applyMode() {
    var mobile = mq.matches;
    accs.forEach(function (d) {
      d.open = mobile ? d.dataset.openDefault === '1' : true;
    });
  }

  if (document.readyState !== 'loading') build();
  else document.addEventListener('DOMContentLoaded', build);
})();
