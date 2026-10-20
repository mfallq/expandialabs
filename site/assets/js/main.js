/* Expandia Labs: progressive enhancement for the one-page site.
   Everything works without this file; it adds the moving parts. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  /* ---------- Case studies ----------
     Three logo tabs. The selected logo fills with colour over a few seconds,
     like a progress bar; when it is full, the next case opens. Clicking a
     logo opens its case and restarts the fill. Pause stops the timer (WCAG
     2.2.2), and it also holds while the section is off screen. With reduced
     motion nothing plays by itself; the tabs simply switch cases. */
  const cases = document.querySelector('[data-cases]');

  if (cases) {
    const tabs = Array.from(cases.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const pauseButton = cases.querySelector('[data-cases-pause]');
    const pauseLabel = cases.querySelector('[data-cases-pause-label]');
    let current = 0;

    cases.style.setProperty('--case-ms', `${Number(cases.dataset.duration) || 10000}ms`);

    const select = (index, { focus = false } = {}) => {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        const on = i === current;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        tab.classList.remove('is-filling');
        panels[i].hidden = !on;
      });
      // Restart the fill and the panel entrance, even on the same tab
      const tab = tabs[current];
      const panel = panels[current];
      void tab.offsetWidth;
      tab.classList.add('is-filling');
      panel.classList.remove('is-entering');
      void panel.offsetWidth;
      panel.classList.add('is-entering');
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));

    cases.querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
      const moves = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      select(moves[event.key], { focus: true });
    });

    // A full logo means the case is done: open the next one
    cases.addEventListener('animationend', (event) => {
      if (event.animationName === 'case-fill' && tabs[current].contains(event.target)) select(current + 1);
    });

    pauseButton?.addEventListener('click', () => {
      const paused = cases.classList.toggle('is-paused');
      if (pauseLabel) pauseLabel.textContent = paused ? 'Play' : 'Pause';
    });

    // Only play while the section is on screen
    cases.classList.add('is-held');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => cases.classList.toggle('is-held', !entry.isIntersecting), { threshold: 0.35 })
        .observe(cases);
    } else {
      cases.classList.remove('is-held');
    }
    const onScreen = () => {
      const box = cases.getBoundingClientRect();
      return box.top < window.innerHeight * 0.65 && box.bottom > window.innerHeight * 0.35;
    };
    document.addEventListener('visibilitychange', () => {
      cases.classList.toggle('is-held', document.hidden || !onScreen());
    });

    cases.classList.add('is-ready');
    select(0);
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
