/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Product Detail (immersive gallery + variants)
   ═══════════════════════════════════════════════════════════ */
import { store } from '../store.js';
import { router } from '../router.js';
import { renderNavbar, initNavbar, renderProductCard, initProductCards, renderFooter, showToast, refreshIcons } from '../components/components.js';
import { initImmersive } from '../immersive.js';

function icon(name, size = 18) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

export function renderProduct(params) {
  const product = store.getBySlug(params.slug);
  if (!product) {
    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div style="padding-top:calc(var(--nav-height) + 4rem);text-align:center">
        <div style="font-size:4rem;margin-bottom:1rem">🌸</div>
        <h2 class="heading-md">Product Not Found</h2>
        <p class="text-muted" style="margin:1rem 0">The fragrance you're looking for doesn't exist or has been removed.</p>
        <a href="#/shop" class="btn btn-primary">Back to Shop</a>
      </div>
      ${renderFooter()}
    `;
    initNavbar();
    refreshIcons();
    return;
  }

  const gallery = store.getImageUrls(product, 900);
  const thumbs = store.getImageUrls(product, 220);
  const variants = store.getVariants(product);
  const defaultVariant = variants.find(v => v.default) || variants[0];

  const related = store.getAll()
    .filter(p => p.slug !== product.slug && (p.brand === product.brand || p.gender === product.gender))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}

    <div class="product-detail page-enter">
      <div class="container">
        <!-- Breadcrumb -->
        <div class="product-crumbs flex items-center gap-xs text-sm text-muted" style="margin:0.5rem 0 1.5rem">
          <a href="#/" style="color:var(--rose)">Home</a>
          ${icon('chevron-right', 14)}
          <a href="#/shop" style="color:var(--rose)">Shop</a>
          ${icon('chevron-right', 14)}
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${product.name}</span>
        </div>

        <div class="product-detail-grid">
          <!-- Gallery -->
          <div class="product-gallery reveal">
            <div class="product-gallery-main" id="gallery-main">
              <img src="${gallery[0]}" alt="${product.name}" id="gallery-main-img" />
              ${gallery.length > 1 ? `
                <button class="gallery-nav gallery-prev" id="gallery-prev" aria-label="Previous image">${icon('chevron-left', 22)}</button>
                <button class="gallery-nav gallery-next" id="gallery-next" aria-label="Next image">${icon('chevron-right', 22)}</button>
                <div class="gallery-counter"><span id="gallery-index">1</span> / ${gallery.length}</div>
              ` : ''}
              <button class="gallery-zoom" id="gallery-zoom" aria-label="Zoom">${icon('maximize-2', 16)}</button>
            </div>
            ${gallery.length > 1 ? `
              <div class="product-gallery-thumbs" id="gallery-thumbs">
                ${thumbs.map((src, i) => `
                  <button class="product-gallery-thumb ${i === 0 ? 'active' : ''}" data-thumb="${i}" aria-label="View ${i + 1}">
                    <img src="${src}" alt="View ${i + 1}" loading="lazy" />
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Info -->
          <div class="product-info reveal">
            ${product.brand ? `<div class="product-info-brand">${product.brand}</div>` : ''}
            <h1 class="product-info-name">${product.name}</h1>
            <div class="product-info-price">
              <span class="currency">MMK</span> <span id="product-price">${store.formatPrice(defaultVariant.price)}</span>
            </div>

            <!-- Status -->
            <div class="flex gap-xs flex-wrap" style="margin-bottom:1.5rem">
              ${product.in_stock
                ? '<span class="badge badge-success">✓ In Stock</span>'
                : '<span class="badge badge-danger">Sold Out</span>'}
              ${product.gender && product.gender !== 'Unknown' ? `<span class="badge badge-botanic">${product.gender}</span>` : ''}
              ${product.concentration ? `<span class="badge badge-gold">${product.concentration}</span>` : ''}
            </div>

            <!-- Variant selector -->
            <div class="variant-block">
              <div class="variant-label">Choose your size <span id="variant-current">· ${defaultVariant.label}</span></div>
              <div class="variant-options" id="variant-options">
                ${variants.map(v => `
                  <button class="variant-pill ${v.id === defaultVariant.id ? 'active' : ''}" data-variant="${v.id}">
                    <span class="variant-pill-size">${v.label}</span>
                    <span class="variant-pill-price">MMK ${store.formatPrice(v.price)}</span>
                    ${v.badge ? `<span class="variant-pill-badge">${v.badge}</span>` : ''}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Meta Grid -->
            <div class="product-meta-grid">
              ${product.gender && product.gender !== 'Unknown' ? metaItem('Gender', product.gender) : ''}
              ${metaItem('Size', `<span id="meta-size">${defaultVariant.size || product.size || '—'}</span>`)}
              ${product.concentration ? metaItem('Concentration', product.concentration) : ''}
              ${product.product_type ? metaItem('Format', `<span id="meta-format">${defaultVariant.type || product.product_type}</span>`) : ''}
            </div>

            <!-- Actions -->
            <div class="product-actions">
              <button class="btn btn-primary btn-lg" id="add-to-cart-btn" ${!product.in_stock ? 'disabled style="opacity:0.5"' : ''}>
                ${icon('shopping-bag', 18)}
                ${product.in_stock ? 'Add to Bag' : 'Sold Out'}
              </button>
              <a href="tel:0943065356" class="btn btn-gold btn-lg">
                ${icon('phone', 18)} Order via Viber
              </a>
            </div>

            <!-- Description -->
            ${product.description ? `
              <div class="product-description">
                <h3>About This Fragrance</h3>
                <p id="product-desc-text">${truncateDescription(product.description)}</p>
                ${product.description.length > 500 ? `
                  <button class="btn btn-ghost btn-sm" id="expand-desc" style="margin-top:0.5rem">
                    Read More ${icon('chevron-down', 14)}
                  </button>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Related Products -->
        ${related.length > 0 ? `
          <section class="section">
            <div class="section-header reveal">
              <div class="scene-divider">${icon('flower-2', 18)}</div>
              <div class="section-eyebrow">You May Also Like</div>
              <h2 class="section-title">Related Fragrances</h2>
            </div>
            <div class="products-grid reveal-children" id="related-grid">
              ${related.map(p => renderProductCard(p)).join('')}
            </div>
          </section>
        ` : ''}
      </div>
    </div>

    ${renderFooter()}
  `;

  initNavbar();
  initProductCards(document.getElementById('related-grid'));
  refreshIcons();
  initImmersive();

  // ── Gallery state ──────────────────────────────────────
  let current = 0;
  let selectedVariant = defaultVariant;
  const mainImg = document.getElementById('gallery-main-img');
  const indexEl = document.getElementById('gallery-index');
  const thumbEls = [...document.querySelectorAll('[data-thumb]')];

  function showImage(i, fromThumb) {
    current = (i + gallery.length) % gallery.length;
    if (mainImg) {
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = gallery[current];
        mainImg.style.opacity = '1';
      }, 130);
    }
    if (indexEl) indexEl.textContent = String(current + 1);
    thumbEls.forEach((t, ti) => t.classList.toggle('active', ti === current));
    const active = thumbEls[current];
    if (active && fromThumb !== true) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    syncLightbox();
  }

  document.getElementById('gallery-prev')?.addEventListener('click', () => showImage(current - 1));
  document.getElementById('gallery-next')?.addEventListener('click', () => showImage(current + 1));
  thumbEls.forEach(t => t.addEventListener('click', () => showImage(parseInt(t.dataset.thumb), true)));

  // Keyboard nav (replace any prior handler to avoid leaks across routes)
  if (window.__galleryKey) window.removeEventListener('keydown', window.__galleryKey);
  window.__galleryKey = (e) => {
    if (document.querySelector('.lightbox')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(current - 1);
      if (e.key === 'ArrowRight') showImage(current + 1);
      return;
    }
    if (!document.getElementById('gallery-main')) return;
    if (e.key === 'ArrowLeft') showImage(current - 1);
    if (e.key === 'ArrowRight') showImage(current + 1);
  };
  window.addEventListener('keydown', window.__galleryKey);

  // Swipe on touch devices
  let touchX = null;
  const mainEl = document.getElementById('gallery-main');
  mainEl?.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  mainEl?.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showImage(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // ── Lightbox (immersive zoom) ──────────────────────────
  function openLightbox() {
    if (document.querySelector('.lightbox')) return;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Close">${icon('x', 24)}</button>
      <button class="gallery-nav gallery-prev lightbox-prev" aria-label="Previous">${icon('chevron-left', 26)}</button>
      <img src="${gallery[current]}" alt="${product.name}" class="lightbox-img" id="lightbox-img" />
      <button class="gallery-nav gallery-next lightbox-next" aria-label="Next">${icon('chevron-right', 26)}</button>
      <div class="gallery-counter lightbox-counter"><span id="lightbox-index">${current + 1}</span> / ${gallery.length}</div>
    `;
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons({ nodes: [lb] });
    lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox-prev').addEventListener('click', () => showImage(current - 1));
    lb.querySelector('.lightbox-next').addEventListener('click', () => showImage(current + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  }
  function closeLightbox() {
    document.querySelector('.lightbox')?.remove();
    document.body.style.overflow = '';
  }
  function syncLightbox() {
    const lbImg = document.getElementById('lightbox-img');
    const lbIdx = document.getElementById('lightbox-index');
    if (lbImg) lbImg.src = gallery[current];
    if (lbIdx) lbIdx.textContent = String(current + 1);
  }
  document.getElementById('gallery-zoom')?.addEventListener('click', openLightbox);
  mainImg?.addEventListener('click', openLightbox);

  // ── Variant selection ──────────────────────────────────
  document.querySelectorAll('[data-variant]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = variants.find(x => x.id === btn.dataset.variant);
      if (!v) return;
      selectedVariant = v;
      document.querySelectorAll('[data-variant]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const priceEl = document.getElementById('product-price');
      if (priceEl) priceEl.textContent = store.formatPrice(v.price);
      const cur = document.getElementById('variant-current');
      if (cur) cur.textContent = `· ${v.label}`;
      const sz = document.getElementById('meta-size'); if (sz) sz.textContent = v.size || '—';
      const fmt = document.getElementById('meta-format'); if (fmt) fmt.textContent = v.type || product.product_type;
    });
  });

  // ── Add to cart ────────────────────────────────────────
  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn && product.in_stock) {
    addBtn.addEventListener('click', () => {
      store.addToCart(product.slug, selectedVariant);
      showToast(`${product.name} (${selectedVariant.label}) added to bag 🛍️`);
      const countEl = document.querySelector('.cart-count');
      if (countEl) countEl.textContent = store.getCartCount();
      else {
        const cartBtn = document.getElementById('cart-toggle');
        if (cartBtn) cartBtn.insertAdjacentHTML('beforeend', `<span class="cart-count">${store.getCartCount()}</span>`);
      }
    });
  }

  // ── Expand description ─────────────────────────────────
  const expandBtn = document.getElementById('expand-desc');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const descP = document.getElementById('product-desc-text');
      if (descP) { descP.textContent = product.description; expandBtn.remove(); }
    });
  }
}

function metaItem(label, value) {
  return `
    <div class="product-meta-item">
      <div class="product-meta-label">${label}</div>
      <div class="product-meta-value">${value}</div>
    </div>`;
}

function truncateDescription(text, maxLen = 500) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
}
