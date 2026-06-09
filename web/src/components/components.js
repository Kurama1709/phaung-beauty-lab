/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Reusable Components
   ═══════════════════════════════════════════════════════════ */
import { store } from '../store.js';
import { router } from '../router.js';

// ─── ICONS (Lucide) ────────────────────────────────────────
function icon(name, size = 18) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

// ─── TOAST NOTIFICATIONS ──────────────────────────────────
let toastContainer = null;
export function showToast(message, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';
  toast.innerHTML = `<span class="toast-icon">${icon(iconName, 18)}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons({ nodes: [toast] });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── MODAL ────────────────────────────────────────────────
export function showModal(title, bodyHTML, footerHTML = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="font-display">${title}</h2>
          <button class="modal-close" data-close>${icon('x', 20)}</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); resolve(null); };
    overlay.querySelector('[data-close]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    if (window.lucide) window.lucide.createIcons({ nodes: [overlay] });
    resolve({ overlay, close });
  });
}

// ─── CONFIRM DIALOG ───────────────────────────────────────
export function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:420px">
        <div class="modal-body" style="text-align:center;padding:2rem">
          <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
          <p style="font-size:1rem;margin-bottom:1.5rem;color:var(--plum)">${message}</p>
          <div class="flex gap-sm justify-center">
            <button class="btn btn-secondary" data-cancel>Cancel</button>
            <button class="btn btn-primary" data-confirm>Delete</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-cancel]').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.querySelector('[data-confirm]').addEventListener('click', () => { overlay.remove(); resolve(true); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}

// ─── NAVBAR ───────────────────────────────────────────────
export function renderNavbar() {
  const cartCount = store.getCartCount();
  const currentPath = router.getCurrentPath();
  const isActive = (path) => currentPath === path ? 'active' : '';

  return `
    <nav class="navbar" id="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand">
          <img src="${import.meta.env.BASE_URL}logo.jpg" alt="Phaung's Beauty Lab" class="brand-logo" />
          <div>
            <div class="brand-name">Phaung's Beauty Lab</div>
            <div class="brand-sub">Beauty · Fragrance</div>
          </div>
        </a>

        <div class="navbar-links">
          <a href="#/" class="${isActive('/')}">Home</a>
          <a href="#/shop" class="${isActive('/shop')}">Shop</a>
          <a href="#/about" class="${isActive('/about')}">About</a>
          <a href="#/admin" class="${isActive('/admin')}">Admin</a>
        </div>

        <div class="navbar-actions">
          <div class="navbar-search">
            <button class="navbar-search-btn" id="nav-search-btn" aria-label="Search" type="button">${icon('search', 16)}</button>
            <input type="text" class="input input-search" placeholder="Search perfumes..." id="nav-search" />
          </div>
          <button class="btn btn-icon btn-ghost cart-btn" id="cart-toggle">
            ${icon('shopping-bag', 20)}
            ${cartCount > 0 ? `<span class="cart-count">${cartCount}</span>` : ''}
          </button>
          <button class="btn btn-icon btn-ghost mobile-menu-btn" id="mobile-menu-toggle">
            ${icon('menu', 22)}
          </button>
        </div>
      </div>
    </nav>
  `;
}

export function initNavbar() {
  // Scroll effect + cozy hide-on-scroll (bind once globally)
  if (!window.__navScrollBound) {
    window.__navScrollBound = true;
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (!navbar) return;
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 10);
      // Hide when scrolling down past the hero area, reveal on scroll up.
      if (Math.abs(y - lastY) > 6) {
        const goingDown = y > lastY;
        navbar.classList.toggle('nav-hidden', goingDown && y > 140 && !document.querySelector('.cart-sidebar, .mobile-menu'));
        lastY = y;
      }
    }, { passive: true });
  }

  // Search (Enter key OR clicking the magnifier button)
  const searchInput = document.getElementById('nav-search');
  const doSearch = () => {
    const q = (searchInput?.value || '').trim();
    if (q) router.navigate(`/shop?search=${encodeURIComponent(q)}`);
    else router.navigate('/shop');
  };
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }
  const searchBtn = document.getElementById('nav-search-btn');
  if (searchBtn) searchBtn.addEventListener('click', doSearch);

  // Cart toggle
  const cartBtn = document.getElementById('cart-toggle');
  if (cartBtn) cartBtn.addEventListener('click', toggleCart);

  // Mobile menu
  const menuBtn = document.getElementById('mobile-menu-toggle');
  if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);
}

// ─── MOBILE MENU ──────────────────────────────────────────
function toggleMobileMenu() {
  const existing = document.querySelector('.mobile-menu');
  if (existing) { existing.remove(); return; }

  const currentPath = router.getCurrentPath();
  const isActive = (path) => currentPath === path ? 'active' : '';

  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.innerHTML = `
    <div class="mobile-menu-panel">
      <div class="mobile-menu-header">
        <span class="flex items-center gap-xs font-display" style="font-size:1.05rem">
          <img src="${import.meta.env.BASE_URL}logo.jpg" alt="" class="brand-logo" style="width:34px;height:34px" /> Phaung's Beauty Lab
        </span>
        <button class="btn btn-icon btn-ghost" id="close-mobile-menu">${icon('x', 22)}</button>
      </div>
      <div class="mobile-menu-search">
        ${icon('search', 16)}
        <input type="text" class="input input-search" placeholder="Search perfumes..." id="mobile-search" />
      </div>
      <div class="mobile-menu-links" style="margin-top:1rem">
        <a href="#/" class="${isActive('/')}">Home</a>
        <a href="#/shop" class="${isActive('/shop')}">Shop All</a>
        <a href="#/shop?gender=Men" class="${isActive('/shop?gender=Men')}">For Men</a>
        <a href="#/shop?gender=Women" class="${isActive('/shop?gender=Women')}">For Women</a>
        <a href="#/about" class="${isActive('/about')}">About</a>
        <a href="#/admin" class="${isActive('/admin')}">Admin Panel</a>
      </div>
    </div>
  `;
  document.body.appendChild(menu);
  if (window.lucide) window.lucide.createIcons({ nodes: [menu] });

  menu.querySelector('#close-mobile-menu').addEventListener('click', () => menu.remove());
  menu.addEventListener('click', (e) => { if (e.target === menu) menu.remove(); });
  menu.querySelectorAll('.mobile-menu-links a').forEach(a => a.addEventListener('click', () => menu.remove()));

  const mobileSearch = menu.querySelector('#mobile-search');
  if (mobileSearch) {
    mobileSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && mobileSearch.value.trim()) {
        menu.remove();
        router.navigate(`/shop?search=${encodeURIComponent(mobileSearch.value.trim())}`);
      }
    });
  }
}

// ─── CART SIDEBAR ─────────────────────────────────────────
function toggleCart() {
  const existing = document.querySelector('.cart-overlay');
  if (existing) { existing.remove(); return; }

  const cartItems = store.getCart();
  const total = store.getCartTotal();

  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  document.body.appendChild(overlay);

  const sidebar = document.createElement('div');
  sidebar.className = 'cart-sidebar';
  sidebar.innerHTML = `
    <div class="cart-header">
      <h2>Shopping Bag ${cartItems.length > 0 ? `(${store.getCartCount()})` : ''}</h2>
      <button class="btn btn-icon btn-ghost" id="close-cart">${icon('x', 22)}</button>
    </div>
    <div class="cart-items">
      ${cartItems.length === 0 ? `
        <div class="cart-empty">
          <span style="font-size:3rem">🛍️</span>
          <p>Your bag is empty</p>
          <a href="#/shop" class="btn btn-secondary btn-sm" id="cart-shop-link">Start Shopping</a>
        </div>
      ` : cartItems.map(item => `
        <div class="cart-item">
          <div class="cart-item-image">
            <img src="${store.getProductImage(item)}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-brand">${item.brand || ''}${item.variantLabel ? ` · <span style="color:var(--rose)">${item.variantLabel}</span>` : ''}</div>
            <div class="cart-item-price">MMK ${store.formatPrice(item.price)} × ${item.qty}</div>
            <button class="cart-item-remove" data-remove="${item.slug}" data-variant="${item.variantId || 'base'}">Remove</button>
          </div>
        </div>
      `).join('')}
    </div>
    ${cartItems.length > 0 ? `
      <div class="cart-footer">
        <div class="cart-total">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-value">MMK ${store.formatPrice(total)}</span>
        </div>
        <button class="btn btn-primary w-full btn-lg" onclick="alert('Order via Viber: 0943065356')">
          ${icon('phone', 16)} Order via Viber
        </button>
        <button class="btn btn-ghost w-full" style="margin-top:0.5rem" id="clear-cart-btn">Clear Bag</button>
      </div>
    ` : ''}
  `;
  document.body.appendChild(sidebar);
  if (window.lucide) window.lucide.createIcons({ nodes: [sidebar] });

  const closeCart = () => { overlay.remove(); sidebar.remove(); };
  overlay.addEventListener('click', closeCart);
  sidebar.querySelector('#close-cart').addEventListener('click', closeCart);

  const shopLink = sidebar.querySelector('#cart-shop-link');
  if (shopLink) shopLink.addEventListener('click', closeCart);

  sidebar.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeFromCart(btn.dataset.remove, btn.dataset.variant || null);
      closeCart();
      toggleCart(); // re-open refreshed
      showToast('Removed from bag');
    });
  });

  const clearBtn = sidebar.querySelector('#clear-cart-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    store.clearCart();
    closeCart();
    showToast('Bag cleared');
  });
}

// ─── PRODUCT CARD ─────────────────────────────────────────
export function renderProductCard(product) {
  const image = store.getProductImage(product);
  const price = store.formatPrice(product.price);
  const badges = [];
  if (!product.in_stock) badges.push('<span class="badge badge-danger">Sold Out</span>');
  else if (product.product_type === 'Tester') badges.push('<span class="badge badge-gold">Tester</span>');
  else if (product.product_type === 'Decant') badges.push('<span class="badge badge-outline">Decant</span>');

  return `
    <div class="product-card animate-fadeInUp" data-slug="${product.slug}">
      <div class="product-card-image">
        <img src="${image}" alt="${product.name}" loading="lazy" onerror="this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"500\" fill=\"%23F8E8E0\"><rect width=\"400\" height=\"500\"/><text x=\"200\" y=\"250\" text-anchor=\"middle\" fill=\"%23B76E79\" font-size=\"48\">🌸</text></svg>')}'"/>
        ${badges.length ? `<div class="product-card-badge">${badges.join('')}</div>` : ''}
        <div class="product-card-actions">
          <button class="btn" data-add-cart="${product.slug}">${icon('shopping-bag', 14)} Add to Bag</button>
          <button class="btn" data-view="${product.slug}">${icon('eye', 14)} View</button>
        </div>
      </div>
      <div class="product-card-info">
        <div class="product-card-brand">${product.brand || ''}</div>
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-meta">
          ${product.size ? `<span class="badge badge-outline">${product.size}</span>` : ''}
          ${product.gender && product.gender !== 'Unknown' ? `<span class="badge badge-outline">${product.gender}</span>` : ''}
        </div>
        <div class="product-card-price">
          <span class="currency">MMK</span> ${price}
        </div>
      </div>
    </div>
  `;
}

export function initProductCards(container) {
  if (!container) return;
  container.querySelectorAll('[data-slug]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-add-cart]')) {
        e.stopPropagation();
        store.addToCart(e.target.closest('[data-add-cart]').dataset.addCart);
        showToast('Added to bag! 🛍️');
        refreshCartCount();
        return;
      }
      const slug = card.dataset.slug;
      router.navigate(`/product/${slug}`);
    });
  });
}

function refreshCartCount() {
  const countEl = document.querySelector('.cart-count');
  const count = store.getCartCount();
  const cartBtn = document.getElementById('cart-toggle');
  if (cartBtn) {
    const existing = cartBtn.querySelector('.cart-count');
    if (existing) existing.remove();
    if (count > 0) {
      cartBtn.insertAdjacentHTML('beforeend', `<span class="cart-count">${count}</span>`);
    }
  }
}

// ─── FOOTER ───────────────────────────────────────────────
export function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-main">
          <div class="footer-brand">
            <div class="footer-brand-name">
              <img src="${import.meta.env.BASE_URL}logo.jpg" alt="Phaung's Beauty Lab" class="brand-logo" style="width:44px;height:44px" />
              Phaung's Beauty Lab
            </div>
            <p class="footer-brand-desc">Genuine branded fragrances, curated with love — serving Myanmar since 2011.</p>
            <div class="footer-contact">
              <a href="tel:0943065356" class="btn btn-sm btn-secondary">${icon('phone', 14)} Viber</a>
              <a href="mailto:yangonbranded@gmail.com" class="btn btn-sm btn-ghost">${icon('mail', 14)} Email</a>
            </div>
          </div>

          <nav class="footer-nav">
            <details class="footer-col">
              <summary class="footer-heading">Shop</summary>
              <div class="footer-links">
                <a href="#/shop?gender=Women">For Women</a>
                <a href="#/shop?gender=Men">For Men</a>
                <a href="#/shop?type=Decant">Decants</a>
                <a href="#/shop?type=Gift Set">Gift Sets</a>
              </div>
            </details>
            <details class="footer-col">
              <summary class="footer-heading">Brands</summary>
              <div class="footer-links">
                <a href="#/shop?brand=Chanel">Chanel</a>
                <a href="#/shop?brand=Versace">Versace</a>
                <a href="#/shop?brand=Lattafa">Lattafa</a>
                <a href="#/shop?brand=Gucci">Gucci</a>
              </div>
            </details>
            <details class="footer-col">
              <summary class="footer-heading">Help</summary>
              <div class="footer-links">
                <a href="#/about">About Us</a>
                <a href="#/about">Delivery &amp; Pickup</a>
                <a href="#/about">Preorder</a>
                <a href="#/admin">Admin</a>
              </div>
            </details>
          </nav>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Phaung's Beauty Lab</span>
          <span>Crafted with love in Myanmar 🇲🇲</span>
        </div>
      </div>
    </footer>
  `;
}

// ─── PAGINATION ───────────────────────────────────────────
export function renderPagination(page, totalPages, onPageChange) {
  if (totalPages <= 1) return '';
  let pages = [];
  const range = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const html = `
    <div class="pagination" id="pagination">
      <button class="pagination-btn ${page <= 1 ? 'disabled' : ''}" data-page="${page - 1}">${icon('chevron-left', 16)}</button>
      ${pages.map(p =>
        p === '...' ? '<span style="padding:0 0.25rem;color:var(--text-light)">…</span>' :
        `<button class="pagination-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`
      ).join('')}
      <button class="pagination-btn ${page >= totalPages ? 'disabled' : ''}" data-page="${page + 1}">${icon('chevron-right', 16)}</button>
    </div>
  `;
  return html;
}

export function initPagination(onPageChange) {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (!isNaN(p)) onPageChange(p);
    });
  });
}

// ─── Initialize Lucide Icons ──────────────────────────────
export function refreshIcons() {
  if (window.lucide) {
    try { window.lucide.createIcons(); } catch (e) {}
  }
}
