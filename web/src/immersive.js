/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Immersive Engine
   Scroll-reveal, hero 3D parallax (mouse + scroll), petal drift.
   All effects degrade gracefully and honor prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let revealObserver = null;
let rafId = null;
let mouseHandler = null;

// ─── Scroll Reveal ─────────────────────────────────────────
// Any element with .reveal fades/rises into view once. Add
// data-reveal-delay="120" (ms) to stagger. .reveal-children
// staggers direct children automatically.
function setupReveal() {
  if (revealObserver) revealObserver.disconnect();

  const targets = document.querySelectorAll('.reveal, .reveal-children > *');
  if (reduceMotion) {
    targets.forEach((el) => el.classList.add('in-view'));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el, i) => {
    // Auto-stagger children of a .reveal-children container.
    if (el.parentElement?.classList.contains('reveal-children')) {
      el.style.transitionDelay = `${Math.min(i, 12) * 70}ms`;
    }
    revealObserver.observe(el);
  });
}

// ─── Hero Parallax (mouse tilt + scroll drift) ─────────────
function setupHeroParallax() {
  const stage = document.querySelector('[data-hero-stage]');
  if (!stage || reduceMotion) return;

  const layers = [...stage.querySelectorAll('[data-depth]')];
  let targetX = 0, targetY = 0, curX = 0, curY = 0, scrollY = 0;

  mouseHandler = (e) => {
    const r = stage.getBoundingClientRect();
    targetX = (e.clientX - (r.left + r.width / 2)) / r.width;   // -0.5..0.5
    targetY = (e.clientY - (r.top + r.height / 2)) / r.height;
  };
  window.addEventListener('pointermove', mouseHandler, { passive: true });

  const onScroll = () => { scrollY = window.scrollY; };
  window.addEventListener('scroll', onScroll, { passive: true });
  stage.__onScroll = onScroll;

  const tick = () => {
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;

    // Whole-stage subtle tilt toward the cursor.
    stage.style.transform =
      `rotateX(${(-curY * 6).toFixed(2)}deg) rotateY(${(curX * 8).toFixed(2)}deg)`;

    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth) || 0;     // 0..1
      const tx = curX * depth * 60;
      const ty = curY * depth * 60;
      const tz = depth * 120;
      const drift = -scrollY * depth * 0.28;                  // scroll-out (dramatic)
      layer.style.transform =
        `translate3d(${tx.toFixed(1)}px, ${(ty + drift).toFixed(1)}px, ${tz}px)`;
    });

    rafId = requestAnimationFrame(tick);
  };
  tick();
}

// ─── Back to Top (created once, global) ────────────────────
function setupBackToTop() {
  let btn = document.getElementById('back-to-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i data-lucide="arrow-up" style="width:20px;height:20px"></i>';
    document.body.appendChild(btn);
    if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
    btn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
  }
}

// ─── Scroll progress line (under the navbar) ───────────────
function setupScrollProgress() {
  let bar = document.getElementById('scroll-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'scroll-progress';
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      bar.style.transform = `scaleX(${Math.min(1, h.scrollTop / max)})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }
}

// ─── 3D tilt on product cards (fine-pointer / laptop only) ─
function setupCardTilt() {
  if (reduceMotion || window.__cardTiltBound) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  window.__cardTiltBound = true;
  let raf = null, last = null;
  const reset = (el) => { if (el) { el.style.transform = ''; el.classList.remove('tilting'); } };
  window.addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const card = e.target?.closest?.('.product-card');
      if (last && last !== card) { reset(last); last = null; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('tilting');
      card.style.transform =
        `perspective(820px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-8px) scale(1.02)`;
      last = card;
    });
  }, { passive: true });
  window.addEventListener('pointerleave', () => { reset(last); last = null; }, { passive: true });
}

// ─── Fly-to-cart micro-animation ───────────────────────────
export function flyToCart(sourceEl) {
  const cart = document.getElementById('cart-toggle');
  if (reduceMotion || !sourceEl || !cart) { bounceCartBadge(); return; }
  const img = sourceEl.tagName === 'IMG' ? sourceEl : sourceEl.querySelector('img');
  const from = (img || sourceEl).getBoundingClientRect();
  const to = cart.getBoundingClientRect();
  const fly = document.createElement(img ? 'img' : 'div');
  if (img) fly.src = img.currentSrc || img.src;
  fly.className = 'fly-to-cart';
  Object.assign(fly.style, {
    left: from.left + 'px', top: from.top + 'px',
    width: Math.min(from.width, 120) + 'px', height: Math.min(from.height, 120) + 'px',
  });
  document.body.appendChild(fly);
  const dx = (to.left + to.width / 2) - (from.left + Math.min(from.width, 120) / 2);
  const dy = (to.top + to.height / 2) - (from.top + Math.min(from.height, 120) / 2);
  requestAnimationFrame(() => {
    fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.12) rotate(18deg)`;
    fly.style.opacity = '0.15';
  });
  setTimeout(() => { fly.remove(); bounceCartBadge(); }, 720);
}

export function bounceCartBadge() {
  const badge = document.querySelector('.cart-count');
  const cart = document.getElementById('cart-toggle');
  if (cart) { cart.classList.remove('cart-pop'); void cart.offsetWidth; cart.classList.add('cart-pop'); }
  if (badge) { badge.classList.remove('badge-bounce'); void badge.offsetWidth; badge.classList.add('badge-bounce'); }
}

// ─── Count-up a number element ─────────────────────────────
export function countUp(el, to, { format = (n) => n.toLocaleString(), duration = 600 } = {}) {
  if (!el) return;
  const from = parseInt(String(el.dataset.val || '0').replace(/[^0-9]/g, ''), 10) || 0;
  el.dataset.val = String(to);
  if (reduceMotion || from === to) { el.textContent = format(to); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ─── Public API ────────────────────────────────────────────
export function initImmersive() {
  // Fresh start each route render.
  if (rafId) cancelAnimationFrame(rafId);
  if (mouseHandler) window.removeEventListener('pointermove', mouseHandler);
  rafId = null;
  mouseHandler = null;

  // The DOM is injected synchronously before this runs, so set up now.
  // (Avoid rAF here — it's paused in hidden/background tabs.)
  const run = () => {
    setupReveal();
    setupHeroParallax();
    setupBackToTop();
    setupScrollProgress();
    setupCardTilt();
  };
  run();
}

export function teardownImmersive() {
  if (rafId) cancelAnimationFrame(rafId);
  if (mouseHandler) window.removeEventListener('pointermove', mouseHandler);
  if (revealObserver) revealObserver.disconnect();
}
