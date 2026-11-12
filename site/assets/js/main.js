/* Expandia Labs: progressive enhancement for the one-page site.
   Everything works without this file; it adds the moving parts. */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Header: transparent over the hero, solid after ---------- */
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('[data-hero]');

  if (header) {
    let queued = false;
    const update = () => {
      queued = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
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

  /* ---------- Side projects menu ----------
     Hover opens it with a mouse (CSS). Click, tap or Enter toggles it;
     Escape, a click outside or tabbing away closes it. */
  document.querySelectorAll('[data-nav-menu]').forEach((menu) => {
    const toggle = menu.querySelector('.nav-menu__toggle');
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    menu.addEventListener('focusout', (event) => {
      if (!menu.contains(event.relatedTarget)) setOpen(false);
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !menu.classList.contains('is-open')) return;
      event.stopPropagation(); // close only this menu, not the whole mobile nav
      setOpen(false);
      toggle.focus();
    });
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) setOpen(false);
    });
  });

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

  /* ---------- Contact form ----------
     Without JS the form posts to contact.php, which answers with a page.
     With JS it is checked here, sent with fetch and answered inline;
     contact.php checks everything again and has the final say. */
  const form = document.querySelector('[data-contact-form]');

  if (form && 'fetch' in window) {
    const submit = form.querySelector('[data-submit]');
    const status = form.querySelector('[data-status]');
    const sent = document.querySelector('[data-sent]');
    const submitLabel = submit.textContent;
    const messages = {
      name: 'Please tell us your name.',
      email: 'Please enter an email address we can reply to, like name@company.com.',
      message: 'Please tell us a little about what you need help with.',
    };

    const setError = (name, text) => {
      const field = form.elements[name];
      const slot = form.querySelector(`[data-error-for="${name}"]`);
      if (!field || !slot) return;
      slot.textContent = text || '';
      field.closest('.field').classList.toggle('has-error', Boolean(text));
      field.setAttribute('aria-invalid', String(Boolean(text)));
    };

    const check = (name) => {
      const field = form.elements[name];
      const ok = field.value.trim() !== '' && field.checkValidity();
      setError(name, ok ? '' : messages[name]);
      return ok;
    };

    // Clear a field's error as soon as it is fixed
    Object.keys(messages).forEach((name) => {
      form.elements[name].addEventListener('input', () => {
        if (form.elements[name].getAttribute('aria-invalid') === 'true') check(name);
      });
    });

    const setBusy = (busy) => {
      submit.toggleAttribute('data-busy', busy);
      submit.disabled = busy;
      submit.textContent = busy ? 'Sending…' : submitLabel;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '';
      status.classList.remove('is-error');

      const invalid = Object.keys(messages).filter((name) => !check(name));
      if (invalid.length) {
        form.elements[invalid[0]].focus();
        return;
      }

      setBusy(true);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.ok) {
          form.hidden = true;
          sent.hidden = false;
          sent.focus();
          return;
        }
        Object.entries(result.errors || {}).forEach(([name, text]) => setError(name, text));
        status.textContent = result.message || 'Your message wasn’t sent. Please try again in a moment.';
        status.classList.add('is-error');
      } catch {
        status.textContent = 'Your message wasn’t sent because the connection failed. Check your connection and try again.';
        status.classList.add('is-error');
      }
      setBusy(false);
    });
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
