/* Askar Jumagulov — site scripts (motion system from the GEROPHARM project) */
(() => {
  'use strict';

  const LANG = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  const RU = LANG === 'ru';
  const PRELOADER_MIN = 2600;
  const PRELOADER_MAX = 9000;
  const PRELOADER_PHOTO = 650;
  const LOADER_GAP = [24, 76];

  const EASE = 'cubic-bezier(.76, 0, .24, 1)';
  const EASE_OUT = 'cubic-bezier(.22, 1, .36, 1)';
  const EASE_IN = 'cubic-bezier(.55, 0, 1, .45)';
  const EASE_POP = 'cubic-bezier(.34, 1.45, .64, 1)';

  const T = {
    en: {
      pm: 'Project Manager', dev: 'Developer', objective: 'Objective', delivered: 'What I delivered',
      team: 'Team', tech: 'Technologies', result: 'Result', visit: 'Visit website', spec: 'Technical specification · PDF',
      next: 'Next case', prev: 'Previous case', similar: 'Have a similar project?', discuss: 'Let’s discuss',
    },
    ru: {
      pm: 'Проджект-менеджер', dev: 'Разработчик', objective: 'Задача', delivered: 'Что сделано',
      team: 'Команда', tech: 'Технологии', result: 'Результат', visit: 'Открыть сайт', spec: 'Техническое задание · PDF',
      next: 'Следующий кейс', prev: 'Предыдущий кейс', similar: 'Похожая задача?', discuss: 'Обсудить',
    },
  }[LANG];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const dur = (ms) => (reduceMotion ? 1 : ms);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ARROW = '<svg class="icon"><use href="#i-arrow"/></svg>';

  const body = document.body;
  const ring = $('#ring');
  const nameEl = $('#heroName');
  const CASES = window.CASES || [];

  /* Кольцо с разрывом под «пузырь» */
  function arcPath(cx, cy, r, gapStart, gapEnd) {
    const p = (deg) => {
      const a = (deg * Math.PI) / 180;
      return `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`;
    };
    const sweep = 360 - (gapEnd - gapStart);
    return `M ${p(gapStart)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${p(gapEnd)}`;
  }

  function sizeRing() {
    const bubble = $('#bubble');
    const d = ring.offsetWidth;
    if (!d) return;
    const c = d / 2;
    const angle = (Math.atan2(bubble.offsetLeft - c, c - bubble.offsetTop) * 180) / Math.PI;
    const half = (Math.asin(Math.min(0.9, (1.4 * (bubble.offsetWidth / 2)) / c)) * 180) / Math.PI;
    $('.ring__svg', ring).setAttribute('viewBox', `0 0 ${d} ${d}`);
    $('#ringTrack').setAttribute('d', arcPath(c, c, c - 0.5, angle - half, angle + half));
    $('#ringArc').setAttribute('d', arcPath(c, c, c - 1, angle - half, angle + half));
  }

  /* Разбивка текста на строки */
  function splitLines(el) {
    if (el._src == null) el._src = el.innerHTML;
    el.innerHTML = el._src;
    const tokens = [];
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/[ \n\t]+/).forEach((w) => { if (w) tokens.push(w); });
      else if (n.nodeName === 'BR') tokens.push(null);
      else if (n.textContent.trim()) tokens.push(n.textContent.trim());
    });
    el.innerHTML = tokens.map((t) => (t === null ? '<br>' : `<span class="w">${esc(t)}</span>`)).join(' ');
    const lines = [];
    let top = null;
    $$('.w', el).forEach((w) => {
      if (top === null || Math.abs(w.offsetTop - top) > 3) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines
      .map((l, i) => `<span class="split-line" style="--i:${i}"><span>${esc(l.join(' '))}</span></span>`)
      .join('');
    el.setAttribute('aria-label', el.textContent);
  }

  const splitAll = () => $$('[data-split="lines"]').forEach((el) => { if (el.offsetParent !== null) splitLines(el); });
  let lastW = window.innerWidth;
  let splitTimer = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(splitTimer);
    splitTimer = setTimeout(splitAll, 150);
  });

  /* Буквы (слова не разрываются) */
  function setChars(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ')
      .map((w) => `<span class="word" aria-hidden="true">${Array.from(w).map((ch) => `<span class="char">${esc(ch)}</span>`).join('')}</span>`)
      .join(' ');
  }
  function charsIn(el, delay = 0) {
    $$('.char', el).forEach((c, i) => c.animate(
      [
        { opacity: 0, transform: 'translateY(.35em)', filter: 'blur(10px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' },
      ],
      { duration: dur(800), delay: dur(delay + i * 38), easing: EASE_OUT, fill: 'backwards' }
    ));
  }

  /* Счётчики */
  function countUp(el) {
    const to = Number(el.dataset.count);
    const small = $('small', el);
    const tail = small ? small.outerHTML : '';
    if (reduceMotion) return;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1600);
      el.innerHTML = `${Math.round(to * (1 - Math.pow(1 - k, 4)))}${tail}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function makeObserver(root) {
    return new IntersectionObserver((entries, obs) => {
      let n = 0;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const d = dur(n * 120);
        e.target.style.setProperty('--d', `${d}ms`);
        if (e.target.hasAttribute('data-reveal')) e.target.style.transitionDelay = `${d}ms`;
        e.target.classList.add('is-in');
        if (e.target.classList.contains('stats')) $$('[data-count]', e.target).forEach(countUp);
        obs.unobserve(e.target);
        n += 1;
      });
    }, { root, threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }
  let pageIO = null;
  const observePage = (scope = document) => {
    if (!pageIO) return;
    $$('[data-split="lines"], [data-reveal], .gallery .photo, .stats', scope)
      .filter((el) => !el.closest('.modal') && !el.classList.contains('is-in'))
      .forEach((el) => pageIO.observe(el));
  };

  /* Плавный скролл */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.stop();
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: target === 0 ? 0 : -10, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-case') || a.closest('.modal')) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = id === 'top' ? 0 : document.getElementById(id);
    if (target == null) return;
    e.preventDefault();
    scrollToTarget(target);
    if (id !== 'top') history.replaceState(null, '', `#${id}`);
  });

  /* Параллакс */
  const heroPhoto = $('.ring__photo img');
  const mqDesktop = window.matchMedia('(min-width: 768px)');
  function parallax() {
    const vh = window.innerHeight;
    const prog = (r) => Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
    $$('.page .gallery .photo').forEach((ph) => {
      const r = ph.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      $('img', ph).style.transform = `translate3d(0, ${(prog(r) * -5).toFixed(2)}%, 0)`;
    });
    if (mqDesktop.matches) {
      $$('.page .gallery__col--shift').forEach((col) => {
        const r = col.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        col.style.translate = `0 ${(prog(r) * vh * 0.08).toFixed(1)}px`;
      });
    }
    const y = window.scrollY;
    if (heroPhoto && y < vh * 1.2) heroPhoto.style.transform = `translate3d(0, ${(y * 0.05).toFixed(1)}px, 0) scale(${1 + y * 0.00015})`;
  }

  let ticking = false;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    body.classList.toggle('is-scrolled', y > 10);
    body.classList.toggle('is-hidden-header', y > 700 && y > lastY + 2);
    if (y < lastY - 2) body.classList.remove('is-hidden-header');
    lastY = y;
    if (!ticking && !reduceMotion) {
      ticking = true;
      requestAnimationFrame(() => { parallax(); ticking = false; });
    }
  }, { passive: true });

  /* Активный пункт меню */
  const navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const a = map.get(e.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('section[id]').forEach((s) => navIO.observe(s));
  }

  /* Бегущая лента */
  const marquee = $('#marquee');
  if (marquee) marquee.innerHTML += marquee.innerHTML;

  /* Часовые пояса */
  const HOME = 300; // GMT+5
  const WORK = [9, 18];
  function tzOffset(tz, d) {
    const local = new Date(d.toLocaleString('en-US', { timeZone: tz }));
    const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    return Math.round((local - utc) / 60000);
  }
  const fmtH = (h) => {
    const x = ((h % 24) + 24) % 24;
    const hh = Math.floor(x);
    const mm = Math.round((x - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };
  function tickZones() {
    const now = new Date();
    $$('#zones .zone').forEach((z) => {
      const tz = z.dataset.tz;
      $('[data-time]', z).textContent = now.toLocaleTimeString(RU ? 'ru-RU' : 'en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
      const shift = (tzOffset(tz, now) - HOME) / 60;
      const s = WORK[0] + shift;
      const e = WORK[1] + shift;
      const bar = $('.zone__bar i', z);
      bar.style.left = `${((((s % 24) + 24) % 24) / 24) * 100}%`;
      bar.style.width = `${((WORK[1] - WORK[0]) / 24) * 100}%`;
      if (z.classList.contains('zone--home')) return;
      const overlap = Math.max(0, Math.min(e, WORK[1]) - Math.max(s, WORK[0]));
      const h = Number.isInteger(overlap) ? overlap : overlap.toFixed(1);
      let note;
      if (shift === 0) note = RU ? 'Тот же часовой пояс · весь рабочий день вместе' : 'Same time zone · the whole working day';
      else note = RU ? `Мои 9–18 = ${fmtH(s)}–${fmtH(e)} у вас · пересечение ${h} ч` : `My 9–18 = ${fmtH(s)}–${fmtH(e)} local · ${h} h overlap`;
      $('[data-note]', z).textContent = note;
    });
  }
  if ($('#zones')) { tickZones(); setInterval(tickZones, 20000); }

  /* ===== Модалки ===== */
  const modals = [];
  function createModal(modal, opts = {}) {
    const scroll = $('.modal__scroll', modal);
    const content = $('.modal__content', modal);
    const closeBtn = $('.modal__close', modal);
    const PAR = { 1: 0.12, 2: 0.22, 3: -0.06, 5: -0.1, 6: -0.05, 7: 0.09, 9: 0.15, 10: 0.17 };
    let isOpen = false;
    let closeTimer = 0;
    let io = null;
    let ml = null;
    let opener = null;

    function setOrigin() {
      let ox = window.innerWidth / 2;
      let oy = window.innerHeight / 2;
      if (opener && opener.isConnected) {
        const r = opener.getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < window.innerHeight) { ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
      }
      const radius = Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)) + 20;
      modal.style.setProperty('--ox', `${ox}px`);
      modal.style.setProperty('--oy', `${oy}px`);
      modal.style.setProperty('--or', `${radius}px`);
    }
    function avaParallax() {
      const st = scroll.scrollTop;
      $$('.ava', modal).forEach((el) => { el.style.translate = `0 ${(-st * (PAR[el.dataset.a] || 0)).toFixed(1)}px`; });
    }
    scroll.addEventListener('scroll', avaParallax, { passive: true });

    function animateIn(delay = 380) {
      if (io) io.disconnect();
      const els = $$('[data-reveal], [data-split="lines"], .photo', modal);
      els.forEach((el) => { el.classList.remove('is-in'); el.style.transitionDelay = ''; });
      $$('[data-split="lines"]', modal).forEach(splitLines);
      setTimeout(() => {
        io = makeObserver(scroll);
        els.forEach((el) => io.observe(el));
      }, dur(delay));
    }

    function open(from) {
      if (isOpen) return;
      isOpen = true;
      opener = from || null;
      clearTimeout(closeTimer);
      if (lenis) lenis.stop();
      modal.hidden = false;
      modal.classList.remove('is-closing');
      setOrigin();
      $$('.ava', modal).forEach((el, i) => { el.style.transitionDelay = `${dur(480 + i * 70)}ms`; });
      scroll.scrollTop = 0;
      animateIn();
      avaParallax();
      void modal.offsetWidth;
      modal.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      if (window.Lenis && !reduceMotion) {
        if (!ml) {
          ml = new window.Lenis({ wrapper: scroll, content, lerp: 0.1 });
          const raf = (t) => { ml.raf(t); requestAnimationFrame(raf); };
          requestAnimationFrame(raf);
        }
        ml.scrollTo(0, { immediate: true });
        ml.start();
      }
      setTimeout(() => closeBtn.focus({ preventScroll: true }), dur(350));
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      if (io) { io.disconnect(); io = null; }
      if (ml) ml.stop();
      setOrigin();
      modal.classList.add('is-closing');
      modal.classList.remove('is-open');
      if (opts.onClose) opts.onClose();
      closeTimer = setTimeout(() => {
        modal.hidden = true;
        modal.classList.remove('is-closing');
        document.documentElement.style.overflow = '';
        if (lenis) lenis.start();
        if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      }, dur(980));
    }

    function reset() {
      if (ml) ml.scrollTo(0, { immediate: true });
      scroll.scrollTop = 0;
      animateIn(60);
    }

    closeBtn.addEventListener('click', close);
    const api = { modal, open, close, reset, get isOpen() { return isOpen; } };
    modals.push(api);
    return api;
  }

  document.addEventListener('keydown', (e) => {
    const m = modals.find((x) => x.isOpen);
    if (!m) return;
    if (e.key === 'Escape') m.close();
    if (e.key === 'Tab') {
      const f = $$('a[href], button', m.modal).filter((el) => el.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
    if (m.onKey) m.onKey(e);
  });

  /* Модалка «Резюме» */
  const cvEl = $('#cv');
  if (cvEl) {
    const cv = createModal(cvEl);
    $$('[aria-controls="cv"]').forEach((b) => b.addEventListener('click', (e) => cv.open(e.currentTarget)));
  }

  /* ===== Кейсы ===== */
  const bySlug = new Map(CASES.map((c) => [c.slug, c]));
  const roleLabel = (c) => (c.role === 'pm' ? T.pm : T.dev);

  function cardHTML(c) {
    const d = c[LANG];
    return `<a class="case" href="#${c.slug}" data-case="${c.slug}">
      <figure class="photo"><img src="${c.cover}" alt="${esc(c.title[LANG])}" loading="lazy"><span class="btn-round photo__go">${ARROW}</span></figure>
      <div class="case__head"><h3 class="case__title">${esc(c.title[LANG])}</h3><span class="pill">${c.year}</span></div>
      <div class="case__meta"><p class="text text--muted">${esc(d.overview)}</p>
      <div class="tags"><span class="tag tag--role">${roleLabel(c)}</span>${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
    </a>`;
  }

  /* Сетка на странице кейсов */
  const grid = $('#casesGrid');
  function renderGrid(filter = 'all') {
    const list = CASES.filter((c) => filter === 'all' || c.role === filter);
    const cols = [[], []];
    list.forEach((c, i) => cols[i % 2].push(cardHTML(c)));
    grid.innerHTML = `<div class="gallery__col">${cols[0].join('')}</div><div class="gallery__col gallery__col--shift">${cols[1].join('')}</div>`;
    observePage(grid);
    parallax();
  }
  if (grid) {
    const filters = $$('[data-filter]');
    filters.forEach((b) => {
      const f = b.dataset.filter;
      const n = f === 'all' ? CASES.length : CASES.filter((c) => c.role === f).length;
      $('i', b).textContent = n;
      b.addEventListener('click', () => {
        if (b.classList.contains('is-active')) return;
        filters.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        grid.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur(250), fill: 'forwards' }).finished.then(() => {
          renderGrid(b.dataset.filter);
          grid.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur(400), fill: 'forwards' });
        });
      });
    });
    renderGrid();
  }

  /* Модалка кейса */
  const caseEl = $('#caseModal');
  let caseModal = null;
  let current = null;
  const ON_CASES_PAGE = !!grid;

  function caseHTML(c) {
    const d = c[LANG];
    const i = CASES.indexOf(c);
    const next = CASES[(i + 1) % CASES.length];
    const list = (arr) => `<ul class="bullets text">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<article class="cm">
      <header class="cm__head">
        <div class="cm__pills" data-reveal><span class="pill pill--blue">${roleLabel(c)}</span><span class="pill">${c.year}</span><span class="pill">${esc(c.duration[LANG])}</span></div>
        <h2 class="cm__title" id="caseTitle" data-split="lines">${esc(c.title[LANG])}</h2>
        <p class="h3 muted cm__lead" data-split="lines">${esc(d.overview)}</p>
      </header>
      <figure class="photo cm__cover"><img src="${c.cover}" alt="${esc(c.title[LANG])}"></figure>
      <div class="modal__body cm__body">
        <aside class="modal__aside">
          <div class="tags" data-reveal>${c.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="cm__links" data-reveal>
            ${c.site ? `<a class="pill pill--btn pill--blue arrow-ne" href="${c.site}" target="_blank" rel="noopener">${T.visit} ${ARROW}</a>` : ''}
            ${c.spec ? `<a class="pill pill--btn pill--line" href="${c.spec}" target="_blank" rel="noopener"><svg class="icon"><use href="#i-down"/></svg>${T.spec}</a>` : ''}
          </div>
        </aside>
        <div class="modal__text">
          <div class="modal__group" data-reveal><span class="label">${T.objective}</span><p class="text text--soft">${esc(d.objective)}</p></div>
          <div class="modal__group" data-reveal><span class="label">${T.delivered}</span>${list(d.delivered)}</div>
          <div class="modal__group" data-reveal><span class="label">${T.team}</span><div class="tags">${d.team.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
          <div class="modal__group" data-reveal><span class="label">${T.tech}</span><p class="text text--soft">${esc(d.tech)}</p></div>
          <div class="cm__result" data-reveal><span class="label">${T.result}</span><p class="text">${esc(d.result)}</p></div>
        </div>
      </div>
      <button class="cm__next" type="button" data-go="${next.slug}" data-reveal>
        <span class="label muted">${T.next}</span>
        <span class="cm__next-title">${esc(next.title[LANG])}</span>
        <span class="cm__next-img"><img src="${next.cover}" alt="" loading="lazy"></span>
      </button>
    </article>`;
  }

  function showCase(slug, from) {
    const c = bySlug.get(slug);
    if (!c || !caseModal) return;
    current = c;
    $('#caseBody').innerHTML = caseHTML(c);
    if (caseModal.isOpen) caseModal.reset();
    else caseModal.open(from);
    if (ON_CASES_PAGE) history.replaceState(null, '', `#${slug}`);
  }
  function step(dir) {
    if (!current) return;
    const i = CASES.indexOf(current);
    const c = CASES[(i + dir + CASES.length) % CASES.length];
    const scrollEl = $('.modal__scroll', caseEl);
    scrollEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur(220), fill: 'forwards' }).finished.then(() => {
      showCase(c.slug);
      scrollEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur(420), fill: 'forwards' });
    });
  }

  if (caseEl && CASES.length) {
    caseModal = createModal(caseEl, {
      onClose: () => { if (ON_CASES_PAGE) history.replaceState(null, '', location.pathname + location.search); },
    });
    caseModal.onKey = (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    $('#casePrev').addEventListener('click', () => step(-1));
    $('#caseNext').addEventListener('click', () => step(1));
    caseEl.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) step(1);
    });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-case]');
      if (!a || !bySlug.has(a.dataset.case)) return;
      e.preventDefault();
      showCase(a.dataset.case, a);
    });
  }

  /* ===== Интро ===== */
  function intro() {
    const fx = (sel, frames, delay, duration, easing = EASE_OUT) => {
      $$(sel).forEach((el) => el.animate(frames, {
        duration: dur(duration), delay: dur(delay), easing, fill: 'backwards',
      }));
    };
    fx('[data-intro="side"]', [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], 250, 1000);
    fx('[data-intro="header"]', [{ opacity: 0 }, { opacity: 1 }], 450, 900);
    fx('[data-intro="media"]', [{ opacity: 0 }, { opacity: 1 }], 200, 1400);
    fx('[data-intro="track"]', [{ opacity: 0 }, { opacity: 1 }], 650, 1100);
    fx('[data-intro="photo"]', [
      { opacity: 0, transform: 'scale(.86)', clipPath: 'circle(0% at 50% 50%)' },
      { opacity: 1, transform: 'scale(1)', clipPath: 'circle(50% at 50% 50%)' },
    ], 700, 1600, EASE);
    if (ring) {
      $('#ringArc').animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }],
        { duration: dur(1800), delay: dur(1100), easing: EASE, fill: 'backwards' });
    }
    fx('[data-intro="bubble"]', [{ opacity: 0, scale: '.3' }, { opacity: 1, scale: '1' }], 1550, 900, EASE_POP);
    if (nameEl) charsIn(nameEl, ring ? 1500 : 200);
    fx('[data-intro="sub"]', [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], ring ? 2100 : 700, 800);

    body.classList.remove('pre');
    pageIO = makeObserver(null);
    observePage();
    parallax();
  }

  function afterIntro() {
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    const id = location.hash.slice(1);
    if (!id) return;
    if (bySlug.has(id) && caseModal) { setTimeout(() => showCase(id), dur(ON_CASES_PAGE ? 500 : 300)); return; }
    const t = document.getElementById(id);
    if (t) setTimeout(() => scrollToTarget(t), dur(300));
  }

  /* Прелоадер */
  const preloader = $('#preloader');
  function runPreloader() {
    const plTrack = $('.preloader__track', preloader);
    const plBar = $('.preloader__bar', preloader);
    const plPct = $('#preloaderPct');
    const plPhotos = $$('.preloader__photos img', preloader);
    plTrack.setAttribute('d', arcPath(50, 50, 49.5, LOADER_GAP[0], LOADER_GAP[1]));
    plBar.setAttribute('d', arcPath(50, 50, 49, LOADER_GAP[0], LOADER_GAP[1]));
    let photo = 0;
    const photoTimer = setInterval(() => {
      plPhotos[photo].classList.remove('is-active');
      photo = (photo + 1) % plPhotos.length;
      plPhotos[photo].classList.add('is-active');
    }, PRELOADER_PHOTO);

    return new Promise((resolve) => {
      const heroImg = $('.ring__photo img');
      const totalItems = plPhotos.length + 2;
      let loaded = 0;
      const done = () => { loaded += 1; };
      [...plPhotos, heroImg].forEach((im) => {
        if (!im || im.complete) done();
        else { im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true }); }
      });
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(done);

      const t0 = performance.now();
      let revisit = false;
      try { revisit = sessionStorage.getItem('aj-visited') === '1'; sessionStorage.setItem('aj-visited', '1'); } catch (err) { /* ignore */ }
      const minT = reduceMotion ? 300 : revisit ? 700 : PRELOADER_MIN;
      let shown = 0;
      function frame(t) {
        const elapsed = Math.max(0, t - t0);
        const real = elapsed > PRELOADER_MAX ? 1 : loaded / totalItems;
        const goal = Math.max(0, Math.min(real, elapsed / minT, 1));
        shown += (goal - shown) * 0.14;
        if (goal - shown < 0.002) shown = goal;
        plBar.style.strokeDashoffset = String(100 - shown * 100);
        plPct.textContent = `${Math.round(shown * 100)}%`;
        if (shown >= 1) { clearInterval(photoTimer); resolve(); } else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  async function hidePreloader() {
    await wait(dur(300));
    $('.preloader__circle', preloader).animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.92)' }],
      { duration: dur(600), easing: EASE_IN, fill: 'forwards' }
    );
    $$('.preloader__title .line > span', preloader).forEach((el, i) => {
      el.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(105%)', opacity: 0 }],
        { duration: dur(600), delay: dur(80 + i * 70), easing: EASE_IN, fill: 'forwards' }
      );
    });
    await wait(dur(520));
    intro();
    await wait(dur(420));
    preloader.classList.add('is-hidden');
    preloader.setAttribute('aria-hidden', 'true');
    afterIntro();
  }

  /* Старт */
  if (nameEl) setChars(nameEl);
  if (ring) {
    sizeRing();
    if ('ResizeObserver' in window) new ResizeObserver(sizeRing).observe(ring);
    else window.addEventListener('resize', sizeRing);
  }
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(splitAll);
  if (preloader) runPreloader().then(hidePreloader);
  else fontsReady.then(() => { intro(); afterIntro(); });
})();
