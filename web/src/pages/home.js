/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Home Page (Immersive)
   ═══════════════════════════════════════════════════════════ */
import { store } from '../store.js';
import { renderNavbar, initNavbar, renderProductCard, initProductCards, renderFooter, refreshIcons } from '../components/components.js';
import { initImmersive } from '../immersive.js';

// Pick N distinct in-stock products that actually have images.
function pickWithImages(pool, n) {
  return pool.filter(p => p.in_stock && (p.images || []).length > 0).slice(0, n);
}

function petals(count = 9) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.round((i / count) * 96 + (i % 3) * 3);
    const size = 10 + (i % 4) * 6;       // 10–28px
    const dur = 13 + (i % 5) * 3;        // 13–25s
    const delay = -(i * 2.1).toFixed(1);
    const drift = (i % 2 ? 1 : -1) * (40 + (i % 3) * 30);
    const variant = i % 2 ? 'petal-teardrop' : 'petal-soft';
    html += `<span class="petal ${variant}" style="left:${left}%;--p-size:${size}px;--p-dur:${dur}s;--p-delay:${delay}s;--p-x:${drift}px"></span>`;
  }
  return html;
}

export function renderHome() {
  const stats = store.getStats();
  const topBrands = store.getBrands().filter(b => b.name && b.name !== 'Other').slice(0, 12);

  const allProducts = store.getAll();
  const premium = allProducts
    .filter(p => p.in_stock && store.parsePrice(p.price) > 100000)
    .sort(() => Math.random() - 0.5);

  const featured = pickWithImages(premium, 8);
  const heroBottles = pickWithImages(premium, 5); // center + 4 satellites

  const menCount = allProducts.filter(p => p.gender === 'Men').length;
  const womenCount = allProducts.filter(p => p.gender === 'Women').length;
  const unisexCount = allProducts.filter(p => p.gender === 'Unisex').length;

  const bottleClass = ['fb-center', 'fb-1', 'fb-2', 'fb-3', 'fb-4'];
  const bottleDepth = [0.28, 0.62, 0.55, 0.7, 0.6];

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}

    <!-- IMMERSIVE HERO -->
    <section class="hero-immersive">
      <div class="hero-aura"></div>
      <div class="petals">${petals(10)}</div>

      <div class="hero-3d">
        <div class="hero-stage" data-hero-stage>
          ${heroBottles.map((p, i) => `
            <a href="#/product/${p.slug}" class="float-bottle ${bottleClass[i]}" data-depth="${bottleDepth[i]}" style="pointer-events:auto" title="${p.name}">
              <img src="${store.getProductImage(p, 0, 500)}" alt="${p.name}" loading="eager" />
            </a>
          `).join('')}
        </div>
      </div>

      <div class="hero-immersive-content">
        <div class="hero-eyebrow">✦ Phaung's Beauty Lab · Beauty &amp; Fragrance ✦</div>
        <h1 class="hero-title">
          Wear Your<br/><span>Most Beautiful Self</span>
        </h1>
        <p class="hero-subtitle">
          ${stats.total}+ genuine branded perfumes from ${stats.brands}+ luxury houses —
          curated, elegant, and delivered to your door across Myanmar.
        </p>
        <div class="hero-cta">
          <a href="#/shop" class="btn btn-primary btn-lg">
            <i data-lucide="sparkles" style="width:18px;height:18px"></i>
            Explore the Collection
          </a>
          <a href="#/shop?gender=Women" class="btn btn-secondary btn-lg">For Her</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-value">${stats.total}+</div>
            <div class="hero-stat-label">Fragrances</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value">${stats.brands}+</div>
            <div class="hero-stat-label">Luxury Brands</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value">15+</div>
            <div class="hero-stat-label">Years Trusted</div>
          </div>
        </div>
      </div>

      <a href="#/shop" class="hero-scroll-cue">
        <span class="dot"></span>
        Discover
      </a>
    </section>

    <!-- SHOP BY CATEGORY -->
    <section class="section" style="background:var(--white)">
      <div class="container">
        <div class="section-header reveal">
          <div class="scene-divider"><i data-lucide="flower-2" style="width:18px;height:18px"></i></div>
          <div class="section-eyebrow">Browse by Category</div>
          <h2 class="section-title">Find Your Perfect Match</h2>
        </div>
        <div class="category-grid reveal-children">
          <a href="#/shop?gender=Women" class="category-card" style="background:linear-gradient(135deg, #B76E79 0%, #D4A0A8 100%)">
            <div class="category-card-icon">🌸</div>
            <div class="category-card-overlay">
              <div class="category-card-title">For Her</div>
              <div class="category-card-count">${womenCount} fragrances</div>
            </div>
          </a>
          <a href="#/shop?gender=Men" class="category-card" style="background:linear-gradient(135deg, #2D1B2E 0%, #4A2F4C 100%)">
            <div class="category-card-icon">🖤</div>
            <div class="category-card-overlay">
              <div class="category-card-title">For Him</div>
              <div class="category-card-count">${menCount} fragrances</div>
            </div>
          </a>
          <a href="#/shop?gender=Unisex" class="category-card" style="background:linear-gradient(135deg, #D4A574 0%, #E8C9A4 100%)">
            <div class="category-card-icon">✨</div>
            <div class="category-card-overlay">
              <div class="category-card-title">Unisex</div>
              <div class="category-card-count">${unisexCount} fragrances</div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- FEATURED PRODUCTS -->
    <section class="section">
      <div class="container">
        <div class="section-header reveal">
          <div class="scene-divider"><i data-lucide="sparkles" style="width:18px;height:18px"></i></div>
          <div class="section-eyebrow">Curated for You</div>
          <h2 class="section-title">Featured Fragrances</h2>
          <p class="section-desc">Hand-picked premium perfumes from our collection</p>
        </div>
        <div class="products-grid reveal-children" id="featured-grid">
          ${featured.map(p => renderProductCard(p)).join('')}
        </div>
        <div class="text-center reveal" style="margin-top:2.5rem">
          <a href="#/shop" class="btn btn-secondary btn-lg">
            View All ${stats.total}+ Products
            <i data-lucide="arrow-right" style="width:16px;height:16px"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- SHOP BY BRAND -->
    <section class="section" style="background:var(--white)">
      <div class="container">
        <div class="section-header reveal">
          <div class="scene-divider"><i data-lucide="crown" style="width:18px;height:18px"></i></div>
          <div class="section-eyebrow">World-Class Brands</div>
          <h2 class="section-title">Shop by Brand</h2>
        </div>
        <div class="brands-grid reveal-children">
          ${topBrands.map(b => `
            <a href="#/shop?brand=${encodeURIComponent(b.name)}" class="brand-card">
              <div class="brand-card-name">${b.name}</div>
              <div class="brand-card-count">${b.count} items</div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- CTA SECTION -->
    <section class="section reveal" style="background:linear-gradient(135deg, var(--plum) 0%, var(--plum-light) 100%);color:var(--white)">
      <div class="container text-center">
        <div class="text-elegant" style="color:var(--gold-light);font-size:1rem;margin-bottom:0.5rem">Get in Touch</div>
        <h2 class="heading-lg" style="color:var(--white);margin-bottom:1rem">Ready to Find Your Signature Scent?</h2>
        <p style="color:rgba(255,255,255,0.7);max-width:500px;margin:0 auto 2rem;line-height:1.7">
          Contact us via Viber for current prices, stock updates, and personalized fragrance recommendations.
        </p>
        <div class="flex gap-md justify-center flex-wrap">
          <a href="tel:0943065356" class="btn btn-gold btn-lg">
            <i data-lucide="phone" style="width:16px;height:16px"></i>
            Viber: 0943065356
          </a>
          <a href="mailto:yangonbranded@gmail.com" class="btn btn-secondary btn-lg" style="border-color:rgba(255,255,255,0.3);color:var(--white)">
            <i data-lucide="mail" style="width:16px;height:16px"></i>
            Email Us
          </a>
        </div>
      </div>
    </section>

    ${renderFooter()}
  `;

  initNavbar();
  initProductCards(document.getElementById('featured-grid'));
  refreshIcons();
  initImmersive();
}
