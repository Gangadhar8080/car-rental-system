/* ============================================
   animations.js - Shared motion behaviors
   Loaded on every page, after api.js/auth.js.
   ============================================ */

(function () {
  /* ---------- Navbar scrolled state ---------- */
  function initNavbarScrollState() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll-reveal via IntersectionObserver ---------- */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal, .reveal-scale, .reveal-stagger');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((t) => {
      // Auto-stagger direct children with incremental delay
      if (t.classList.contains('reveal-stagger')) {
        Array.from(t.children).forEach((child, i) => {
          child.style.setProperty('--d', `${i * 70}ms`);
        });
      }
      observer.observe(t);
    });
  }

  /* Re-run reveal wiring for content injected dynamically after fetch (e.g. car grids) */
  window.refreshScrollReveal = function () {
    initScrollReveal();
  };

  /* ---------- Button ripple effect ---------- */
  function initButtonRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple-el';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  }

  /* ---------- Animated number counters (.counter[data-target]) ---------- */
  function animateCounter(el) {
    const target = Number(el.dataset.target || el.textContent.replace(/[^\d.]/g, '')) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value.toLocaleString('en-IN')}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.animateCounters = function (selector = '.counter') {
    document.querySelectorAll(selector).forEach(animateCounter);
  };

  document.addEventListener('DOMContentLoaded', () => {
    initNavbarScrollState();
    initScrollReveal();
    initButtonRipple();
  });
})();
