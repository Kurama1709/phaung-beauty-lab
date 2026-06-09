/* ═══════════════════════════════════════════════════════════
   PHAUNG'S BEAUTY LAB — About Page (immersive)
   ═══════════════════════════════════════════════════════════ */
import { renderNavbar, initNavbar, renderFooter, refreshIcons } from '../components/components.js';
import { initImmersive } from '../immersive.js';

export function renderAbout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}

    <!-- Story hero -->
    <section class="about-hero">
      <div class="hero-aura"></div>
      <div class="container about-hero-inner reveal">
        <img src="${import.meta.env.BASE_URL}logo.jpg" alt="Phaung's Beauty Lab" class="about-logo" />
        <div class="hero-eyebrow">✦ Beauty &amp; Fragrance · Since 2011 ✦</div>
        <h1 class="heading-xl" style="margin-bottom:1.25rem">Our Story</h1>
        <p class="text-lg" style="color:var(--olive);max-width:680px;margin:0 auto">
          <strong>Phaung's Beauty Lab</strong> has been Myanmar's trusted destination for authentic
          luxury fragrances for over a decade. We believe a signature scent is an invisible —
          yet unforgettable — accessory, and we curate each one with care.
        </p>
      </div>
    </section>

    <div style="padding:1rem 0 4rem">
      <div class="container">

        <!-- Value cards -->
        <div class="about-grid reveal-children">
          <div class="about-card">
            <div class="about-card-icon">💎</div>
            <h3 class="heading-md" style="margin-bottom:0.75rem">100% Authentic</h3>
            <p class="text-muted">
              We source directly from authorized distributors. Every bottle is guaranteed genuine,
              in original sealed retail packaging.
            </p>
          </div>

          <div class="about-card about-card-feature">
            <div class="about-card-icon">🚚</div>
            <h3 class="heading-md" style="margin-bottom:0.75rem">Delivery &amp; Pickup</h3>
            <p style="color:rgba(47,61,44,0.85)">
              Convenient home delivery across Yangon (prepaid). Prefer to browse in person?
              Choose self-pickup at checkout.
            </p>
          </div>

          <div class="about-card">
            <div class="about-card-icon">🎁</div>
            <h3 class="heading-md" style="margin-bottom:0.75rem">Preorder Service</h3>
            <p class="text-muted">
              Looking for a rare or niche fragrance we don't currently stock? Use our preorder
              service via Viber and we'll source it for you.
            </p>
          </div>
        </div>

        <!-- Founder / trust -->
        <div class="founder-feature reveal">
          <div class="scene-divider"><i data-lucide="heart" style="width:16px;height:16px"></i></div>
          <div class="text-elegant" style="color:var(--gold-deep)">With love</div>
          <h2 class="heading-lg" style="margin:0.25rem 0 1.25rem">Meet the Founder</h2>
          <div class="founder-banner">
            <img src="${import.meta.env.BASE_URL}founder.jpg"
                 alt="Phaung's Beauty Lab — You are beautiful, inside and out"
                 onerror="this.onerror=null;this.closest('.founder-banner').style.display='none'" />
          </div>
          <p class="text-muted" style="max-width:640px;margin:1.5rem auto 0;line-height:1.8">
            Every fragrance at Phaung's Beauty Lab is hand-picked with care — chosen to make
            you feel elegant, confident, and unmistakably yourself. What began as a love for
            beautiful scents has grown into a trusted little boutique serving fragrance lovers
            across Myanmar.
          </p>
          <div class="founder-sign">— Phaung</div>
        </div>

        <!-- Contact -->
        <div class="about-contact reveal">
          <div class="scene-divider"><i data-lucide="flower-2" style="width:18px;height:18px"></i></div>
          <div class="text-elegant" style="color:var(--gold-light);margin-bottom:0.5rem">Get In Touch</div>
          <h2 class="heading-lg" style="margin-bottom:2rem;color:var(--white)">We're Here to Help</h2>

          <div class="about-contact-grid">
            <div>
              <i data-lucide="phone" style="width:24px;height:24px;color:var(--gold-light)"></i>
              <div class="about-contact-label">Viber &amp; Phone</div>
              <a href="tel:0943065356">0943065356</a><br>
              <a href="tel:09250511966">09250511966</a>
            </div>
            <div>
              <i data-lucide="mail" style="width:24px;height:24px;color:var(--gold-light)"></i>
              <div class="about-contact-label">Email</div>
              <a href="mailto:yangonbranded@gmail.com">yangonbranded@gmail.com</a>
            </div>
            <div>
              <i data-lucide="map-pin" style="width:24px;height:24px;color:var(--gold-light)"></i>
              <div class="about-contact-label">Location</div>
              <span style="color:rgba(255,255,255,0.8)">Yangon, Myanmar<br>(Contact for pickup address)</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    ${renderFooter()}
  `;

  initNavbar();
  refreshIcons();
  initImmersive();
}
