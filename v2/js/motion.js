/* Motion engine · vanilla, one file for both versions */
(function () {
  var d = document, h = d.documentElement, w = window;
  var fine = w.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* strip + header height -> --top-h */
  var top = d.querySelector('.topbar');
  function setTop() { if (top) h.style.setProperty('--top-h', top.offsetHeight + 'px'); }
  setTop();
  if (w.ResizeObserver && top) new ResizeObserver(setTop).observe(top);

  /* mobile menu */
  var btn = d.querySelector('.burger'), menu = d.getElementById('menu');
  function closeMenu() { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); }
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var o = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!o)); menu.classList.toggle('open', !o);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); btn.focus(); } });
    w.addEventListener('resize', function () { if (w.innerWidth >= 1000) closeMenu(); });
  }

  /* map on click */
  d.querySelectorAll('[data-map]').forEach(function (m) {
    var b = m.querySelector('button');
    if (!b) return;
    b.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = m.getAttribute('data-map'); f.title = 'Карта: Южный Ветер, Университетский пер., 131А';
      f.setAttribute('allowfullscreen', ''); f.loading = 'lazy';
      m.textContent = ''; m.appendChild(f); m.classList.add('loaded');
    });
  });

  if (!h.classList.contains('m-on')) return;   /* reduced motion or fallback: final state, nothing moves */

  /* word split */
  function split(el, cls, step) {
    var i = 0, label = el.textContent.replace(/\s+/g, ' ').trim();
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var o = d.createElement('span'), inn = d.createElement('span');
            o.className = cls; inn.className = cls + 'i'; inn.textContent = p;
            inn.style.setProperty('--d', (i++ * step) + 'ms');
            o.appendChild(inn); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    return { n: i, label: label };
  }
  d.querySelectorAll('[data-rv="words"]').forEach(function (el) {
    var r = split(el, 'w', el.tagName === 'H1' ? 70 : 60);
    el.setAttribute('aria-label', r.label);
    Array.prototype.forEach.call(el.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
  });

  /* stagger index from parent */
  d.querySelectorAll('[data-stagger]').forEach(function (p) {
    var k = 0;
    Array.prototype.forEach.call(p.children, function (c) { if (c.hasAttribute('data-rv')) c.style.setProperty('--i', k++); });
  });

  /* light-up paragraph */
  var lights = [];
  d.querySelectorAll('[data-light]').forEach(function (p) {
    var words = [];
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (t) { return '<span class="lw">' + t + '</span>'; }).join(' ');
    p.querySelectorAll('.lw').forEach(function (s) { words.push(s); });
    lights.push({ el: p, words: words });
  });

  /* curtain end -> clip-path:none */
  d.querySelectorAll('[data-rv="curtain"]').forEach(function (f) {
    f.addEventListener('transitionend', function (e) { if (e.target === f && e.propertyName === 'clip-path') f.classList.add('done'); });
  });

  /* scramble captions (T4) */
  var marks = '#/+=×<>[]{}';
  function scramble(el) {
    var tw = el.querySelector('.twin'); if (!tw) return;
    var txt = el.getAttribute('data-text'), t0 = null, dur = 650;
    function f(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), n = Math.floor(p * txt.length), out = txt.slice(0, n);
      for (var j = n; j < txt.length; j++) out += txt[j] === ' ' ? ' ' : marks[(j * 7 + Math.floor(ts / 40)) % marks.length];
      tw.textContent = out;
      if (p < 1) requestAnimationFrame(f); else tw.textContent = txt;
    }
    requestAnimationFrame(f);
  }

  /* reveal: IO + sweep */
  function show(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    if (el.hasAttribute('data-text')) scramble(el);
  }
  var items = Array.prototype.slice.call(d.querySelectorAll('[data-rv]:not([data-hero])'));
  var io = 'IntersectionObserver' in w ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  items.forEach(function (el) { io ? io.observe(el) : show(el); });
  var tones = Array.prototype.slice.call(d.querySelectorAll('[data-tone]'));
  function sweep() {
    var vh = w.innerHeight;
    tones.forEach(function (t) { if (t.getBoundingClientRect().top < vh * 0.7) t.classList.add('tin'); });
    items.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh) show(el); });
  }

  /* hero intro chain */
  function hero() {
    d.querySelectorAll('[data-hero]').forEach(function (el) {
      setTimeout(function () { show(el); }, +el.getAttribute('data-hero') || 300);
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', hero); else hero();

  /* scroll-linked: light paragraph, final panel, lanes */
  var finals = d.querySelectorAll('.final');
  var lanes = [];
  d.querySelectorAll('[data-lane]').forEach(function (s) {
    lanes.push({ s: s, track: s.querySelector('.lane-track'), bar: s.querySelector('.lane-bar i'), max: +s.getAttribute('data-lane') || 0, dist: 0, extra: 0 });
  });
  function layoutLanes() {
    var wide = w.innerWidth >= 900;
    lanes.forEach(function (L) {
      L.s.classList.toggle('lane-on', wide);
      if (!wide) { L.s.style.height = ''; L.track.style.transform = ''; return; }
      var vw = L.track.parentNode.clientWidth;
      L.extra = Math.max(0, L.track.scrollWidth - vw);
      L.dist = L.max ? Math.min(L.extra, L.max * w.innerHeight) : L.extra;
      L.s.style.height = (L.s.querySelector('.lane-pin').offsetHeight + L.dist) + 'px';
    });
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = w.innerHeight;
    lights.forEach(function (L) {
      var r = L.el.getBoundingClientRect();
      var p = clamp((vh * 0.9 - r.top) / (vh * 0.5 + r.height));
      var n = Math.round(p * L.words.length);
      L.words.forEach(function (s, i) { s.style.opacity = i < n ? 1 : 0.25; });
    });
    finals.forEach(function (f) {
      var r = f.getBoundingClientRect();
      var p = clamp((vh - r.top) / (vh * 0.6));
      f.style.setProperty('--fx', (48 * (1 - p)).toFixed(1) + 'px');
    });
    lanes.forEach(function (L) {
      if (!L.s.classList.contains('lane-on')) return;
      var r = L.s.getBoundingClientRect();
      var p = L.dist ? clamp(-r.top / L.dist) : 0;
      L.track.style.transform = 'translate3d(' + (-p * L.extra).toFixed(1) + 'px,0,0)';
      if (L.bar) L.bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    });
    sweep();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', function () { layoutLanes(); onScroll(); });
  w.addEventListener('hashchange', function () { setTimeout(frame, 60); });
  w.addEventListener('load', function () { layoutLanes(); frame(); });
  w.addEventListener('beforeprint', function () { items.forEach(show); tones.forEach(function (t) { t.classList.add('tin'); }); });
  layoutLanes();
  if (w.ResizeObserver) lanes.forEach(function (L) { new ResizeObserver(function () { layoutLanes(); onScroll(); }).observe(L.track); });

  /* cursor: tilt + light spot (fine pointer only) */
  if (fine) {
    var tilt = d.querySelector('[data-tilt]'), spot = d.querySelector('.spot'), mx = 0, my = 0, raf = 0;
    w.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        if (spot) spot.style.transform = 'translate3d(' + (mx - 300) + 'px,' + (my - 300) + 'px,0)';
        if (tilt) {
          var r = tilt.getBoundingClientRect();
          if (r.bottom > 0 && r.top < w.innerHeight) {
            var x = (mx - (r.left + r.width / 2)) / w.innerWidth, y = (my - (r.top + r.height / 2)) / w.innerHeight;
            tilt.style.setProperty('--tx', (x * 6).toFixed(2) + 'deg');
            tilt.style.setProperty('--ty', (y * -4).toFixed(2) + 'deg');
          }
        }
      });
    }, { passive: true });
  }

  h.classList.add('m-ready');
  frame();
})();
