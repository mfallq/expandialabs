/* Expandia Labs: progressive enhancement for the one-page site.
   Everything works without this file; it adds the moving parts. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isPaused = () => root.classList.contains('motion-paused');

  /* ---------- Header: transparent over the hero, solid after ---------- */
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('[data-hero]');

  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (header && hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-solid', !entry.isIntersecting),
      { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` }
    );
    observer.observe(hero);
  }

  /* ---------- Mobile menu ---------- */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navList = document.querySelector('[data-nav-list]');

  if (navToggle && navList) {
    const setOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      navList.classList.toggle('is-open', open);
      header?.classList.toggle('menu-open', open);
    };
    navToggle.addEventListener('click', () => setOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
    navList.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || navToggle.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
      navToggle.focus();
    });
  }

  /* ---------- Pause / play all motion (WCAG 2.2.2) ---------- */
  const motionToggles = document.querySelectorAll('[data-motion-toggle]');

  const renderMotionToggles = () => {
    motionToggles.forEach((button) => {
      const label = button.querySelector('[data-motion-label]') || button;
      label.textContent = isPaused() ? 'Play motion' : 'Pause motion';
    });
  };

  motionToggles.forEach((button) => {
    button.addEventListener('click', () => {
      const paused = !isPaused();
      root.classList.toggle('motion-paused', paused);
      try { localStorage.setItem('motion', paused ? 'paused' : 'playing'); } catch (e) { /* private mode */ }
      renderMotionToggles();
    });
  });
  renderMotionToggles();

  /* ---------- Focus carousels ----------
     One full-width row. The two middle items are flat and in focus; the rest
     turn away and fade the further they are from the centre, like a ring.
     Every few seconds the row glides one step to the right. The arrows, a
     click on a side item, or the arrow keys move it by hand. Two cloned sets
     sit on each side of the originals; when the focus leaves the original
     set we jump silently by one set width, so the loop never ends. Clones
     are hidden from assistive tech. */
  const carousels = Array.from(document.querySelectorAll('[data-carousel]')).map((root) => ({
    root,
    track: root.querySelector('[data-carousel-track]'),
    originals: Array.from(root.querySelector('[data-carousel-track]').children),
    index: 0,
    focus: 2,
    timer: 0,
    snapTimer: 0,
    offscreen: false,
  }));

  const cloneSet = (items) => items.map((item) => {
    const clone = item.cloneNode(true);
    clone.setAttribute('data-clone', '');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button, [tabindex]').forEach((el) => el.setAttribute('tabindex', '-1'));
    return clone;
  });

  const glideMs = (c) => parseFloat(getComputedStyle(c.root).getPropertyValue('--glide')) * 1000 || 1400;

  const place = (c, animate) => {
    const items = Array.from(c.track.children);
    const first = items[c.index];
    if (!first) return;
    const step = items[1].offsetLeft - items[0].offsetLeft;
    const gap = step - items[0].offsetWidth;
    const span = c.focus * step - gap;
    const x = c.root.clientWidth / 2 - (first.offsetLeft + span / 2);
    const centre = first.offsetLeft + span / 2;

    c.root.classList.toggle('is-snapping', !animate);
    c.track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    items.forEach((item, i) => {
      // Distance from the focus pair, in steps: 0 inside it, 1 for the next one out
      const offset = (item.offsetLeft + item.offsetWidth / 2 - centre) / step;
      const away = Math.max(0, Math.abs(offset) - (c.focus - 1) / 2);
      const side = Math.sign(offset);
      item.classList.toggle('is-focus', i >= c.index && i < c.index + c.focus);
      item.style.setProperty('--turn', `${(-side * Math.min(away, 3) * 16).toFixed(1)}deg`);
      item.style.setProperty('--shrink', (1 - Math.min(away, 3) * 0.07).toFixed(3));
      item.style.setProperty('--fade', Math.max(0.22, 1 - away * 0.38).toFixed(3));
    });
    if (!animate) {
      void c.track.offsetWidth; // apply without transition, then restore it
      c.root.classList.remove('is-snapping');
    }
  };

  // Keep the focus inside the original set, so there is always room both ways
  const normalise = (c) => {
    const n = c.originals.length;
    let shift = 0;
    while (c.index + shift < 2 * n) shift += n;
    while (c.index + shift >= 3 * n) shift -= n;
    if (!shift) return;
    clearTimeout(c.snapTimer);
    c.snapTimer = setTimeout(() => { c.index += shift; place(c, false); }, glideMs(c) + 60);
  };

  const go = (c, delta) => {
    clearTimeout(c.snapTimer);
    c.index += delta;
    place(c, true);
    normalise(c);
  };

  const schedule = (c) => {
    clearTimeout(c.timer);
    if (!c.root.classList.contains('is-running')) return;
    c.timer = setTimeout(() => {
      const held = isPaused() || c.offscreen || document.hidden || c.root.matches(':hover, :focus-within');
      if (!held) go(c, -1); // content moves right; the item on the left turns into focus
      schedule(c);
    }, Number(c.root.dataset.interval) || 3500);
  };

  const buildCarousel = (c) => {
    clearTimeout(c.timer);
    clearTimeout(c.snapTimer);
    c.track.querySelectorAll('[data-clone]').forEach((node) => node.remove());
    c.track.style.removeProperty('transform');
    c.root.classList.remove('is-running');
    c.originals.forEach((item) => {
      item.classList.remove('is-focus');
      ['--turn', '--shrink', '--fade'].forEach((prop) => item.style.removeProperty(prop));
    });
    if (reduceMotion.matches || c.originals.length < 3) return;

    c.track.prepend(...cloneSet(c.originals), ...cloneSet(c.originals));
    c.track.append(...cloneSet(c.originals), ...cloneSet(c.originals));
    c.root.classList.add('is-running');

    const items = c.track.children;
    const step = items[1].offsetLeft - items[0].offsetLeft;
    c.focus = c.root.clientWidth >= 2 * step ? 2 : 1;
    c.index = 2 * c.originals.length;
    place(c, false);
    schedule(c);
  };

  carousels.forEach((c) => {
    c.root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => { go(c, -1); schedule(c); });
    c.root.querySelector('[data-carousel-next]')?.addEventListener('click', () => { go(c, 1); schedule(c); });

    // Click a turned-away item to bring it into focus
    c.track.addEventListener('click', (event) => {
      if (!c.root.classList.contains('is-running')) return;
      const item = event.target.closest('.carousel__item');
      if (!item || item.classList.contains('is-focus')) return;
      event.preventDefault();
      const i = Array.from(c.track.children).indexOf(item);
      go(c, i < c.index ? i - c.index : i - (c.index + c.focus - 1));
      schedule(c);
    });

    // Older browsers without overflow: clip may scroll the row when focusing; undo it
    c.root.addEventListener('scroll', () => { c.root.scrollLeft = 0; });

    c.root.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      go(c, event.key === 'ArrowLeft' ? -1 : 1);
    });
  });

  const buildAll = () => carousels.forEach(buildCarousel);
  buildAll();

  // Widths can change once Inter arrives, so measure again.
  document.fonts?.ready.then(buildAll);

  let lastWidth = window.innerWidth;
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      buildAll();
    }, 160);
  });

  reduceMotion.addEventListener?.('change', buildAll);

  // Save battery: no gliding while a carousel is off screen.
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const c = carousels.find((item) => item.root === entry.target);
        if (c) c.offscreen = !entry.isIntersecting;
      });
    });
    carousels.forEach((c) => visibility.observe(c.root));
  }

  /* ---------- The bubble finds its level ----------
     Move the pointer around the hero and the bubble (the eye's pupil) follows
     it, up, down and sideways, like a spirit level being tilted. It stays
     inside the vial, and when the pointer rests it settles dead-centre again. */
  const bubble = document.querySelector('[data-bubble]');
  const visual = document.querySelector('.hero__visual');

  if (bubble && visual && hero) {
    // SVG units. An ellipse of 36 x 30 keeps the bubble (r 71) inside the
    // almond (half-height 115) and between the marks (inner edges at ±115).
    const MAX_X = 36;
    const MAX_Y = 30;
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let frame = 0;
    let idleTimer = 0;

    const step = () => {
      ['x', 'y'].forEach((axis) => {
        vel[axis] = (vel[axis] + (target[axis] - pos[axis]) * 0.05) * 0.84;
        pos[axis] += vel[axis];
      });
      bubble.setAttribute('transform', `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`);
      const settled = ['x', 'y'].every((axis) => Math.abs(vel[axis]) < 0.01 && Math.abs(target[axis] - pos[axis]) < 0.01);
      frame = settled ? 0 : requestAnimationFrame(step);
    };
    const run = () => { if (!frame) frame = requestAnimationFrame(step); };
    const settle = () => { target.x = 0; target.y = 0; run(); };

    hero.addEventListener('pointermove', (event) => {
      if (reduceMotion.matches || isPaused()) return;
      const box = visual.getBoundingClientRect();
      const heroBox = hero.getBoundingClientRect();
      let nx = (event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
      let ny = (event.clientY - (box.top + box.height / 2)) / (heroBox.height / 2);
      const length = Math.hypot(nx, ny);
      if (length > 1) { nx /= length; ny /= length; } // stay inside the ellipse
      target.x = nx * MAX_X;
      target.y = ny * MAX_Y;
      run();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(settle, 900);
    });
    hero.addEventListener('pointerleave', settle);
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => revealer.observe(el));

    // A jump (#hash link, page restore) can skip elements entirely. After any
    // scroll settles, show everything that is above the fold.
    let settleTimer = 0;
    const revealPassed = () => {
      reveals.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
      });
    };
    window.addEventListener('scroll', () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(revealPassed, 150);
    }, { passive: true });
    window.addEventListener('load', revealPassed);
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
