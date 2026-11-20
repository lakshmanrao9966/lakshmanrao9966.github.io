/* Dr. Kolla Lakshman Rao | Portfolio interactions
   Theme toggle, mobile menu, scroll progress, active section, reveal on scroll,
   animated counters and copy-email. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasObserver = 'IntersectionObserver' in window;

  root.classList.add('is-enhanced');

  /* ---------- Theme ---------- */
  var STORAGE_KEY = 'klr-theme';
  var themeToggle = document.querySelector('.theme-toggle');

  function storedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* storage unavailable */ }
    }
  }

  setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }

  // Follow the system setting until the visitor makes a choice.
  if (window.matchMedia) {
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function (event) {
      var saved = storedTheme();
      if (saved !== 'light' && saved !== 'dark') setTheme(event.matches ? 'dark' : 'light', false);
    };
    if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector('.nav__toggle');
  var navMenu = document.getElementById('nav-menu');

  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navMenu.classList.toggle('is-open', open);
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navMenu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        navToggle.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (navToggle.getAttribute('aria-expanded') === 'true' && !event.target.closest('.nav')) setMenu(false);
    });
  }

  /* ---------- Scroll progress ---------- */
  var progressBar = document.querySelector('.progress__bar');
  var ticking = false;

  function updateProgress() {
    ticking = false;
    if (!progressBar) return;
    var max = root.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = 'scaleX(' + ratio + ')';
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ---------- Active section in the navbar ---------- */
  var navLinks = {};
  Array.prototype.forEach.call(document.querySelectorAll('.nav__menu a[href^="#"]'), function (link) {
    navLinks[link.getAttribute('href').slice(1)] = link;
  });

  function setActive(key) {
    Object.keys(navLinks).forEach(function (id) {
      if (id === key) navLinks[id].setAttribute('aria-current', 'true');
      else navLinks[id].removeAttribute('aria-current');
    });
  }

  var tracked = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  if (hasObserver && tracked.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var key = entry.target.getAttribute('data-nav') || entry.target.id;
        setActive(navLinks[key] ? key : null);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    tracked.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    var final = target.toFixed(decimals) + suffix;
    if (reduceMotion) { el.textContent = final; return; }
    var duration = 1400;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = t < 1 ? (target * eased).toFixed(decimals) + suffix : final;
      if (t < 1) window.requestAnimationFrame(frame);
    }
    el.textContent = (0).toFixed(decimals) + suffix;
    window.requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('.count[data-count]');
  // Start counters from zero so the first paint does not flash the final figure.
  if (hasObserver && !reduceMotion) {
    Array.prototype.forEach.call(counters, function (el) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      el.textContent = (0).toFixed(decimals) + (el.getAttribute('data-suffix') || '');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if (!hasObserver || reduceMotion) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    Array.prototype.forEach.call(reveals, function (el) { revealObserver.observe(el); });

    var countObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (el) { countObserver.observe(el); });
  }

  /* ---------- Copy email ---------- */
  var copyButton = document.querySelector('[data-copy]');
  var copyStatus = document.querySelector('[data-copy-status]');
  if (copyButton && navigator.clipboard && window.isSecureContext) {
    copyButton.hidden = false;
    var resetTimer = null;
    copyButton.addEventListener('click', function () {
      navigator.clipboard.writeText(copyButton.getAttribute('data-copy')).then(function () {
        copyButton.textContent = 'Email copied';
        if (copyStatus) copyStatus.textContent = 'Email address copied to the clipboard.';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          copyButton.textContent = 'Copy email';
          if (copyStatus) copyStatus.textContent = '';
        }, 2400);
      }).catch(function () {
        copyButton.textContent = 'Copy failed, select the address instead';
      });
    });
  }

  /* ---------- Footer year ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
