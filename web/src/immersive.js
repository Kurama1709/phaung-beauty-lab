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
      const drift = -scrollY * depth * 0.18;                  // scroll-out
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

// ─── Public API ────────────────────────────────────────────
export function initImmersive() {
  // Fresh start each route render.
  if (rafId) cancelAnimationFrame(rafId);
  if (mouseHandler) window.removeEventListener('pointermove', mouseHandler);
  rafId = null;
  mouseHandler = null;

  // Defer one frame so freshly-injected DOM is laid out first.
  requestAnimationFrame(() => {
    setupReveal();
    setupHeroParallax();
    setupBackToTop();
  });
}

export function teardownImmersive() {
  if (rafId) cancelAnimationFrame(rafId);
  if (mouseHandler) window.removeEventListener('pointermove', mouseHandler);
  if (revealObserver) revealObserver.disconnect();
}
