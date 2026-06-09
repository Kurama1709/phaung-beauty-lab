/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Data Store (CRUD + localStorage)
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'phaung_products';
const CART_KEY = 'phaung_cart';

// Crawled text is sometimes double HTML-encoded ("&amp;amp;"). Decode to plain text.
function decodeEntities(str) {
  if (!str || str.indexOf('&') === -1) return str;
  const ta = document.createElement('textarea');
  let out = str;
  for (let i = 0; i < 2; i++) {
    ta.innerHTML = out;
    const next = ta.value;
    if (next === out) break;
    out = next;
  }
  return out;
}

class Store {
  constructor() {
    this.products = [];
    this.cart = [];
    this.loaded = false;
    this.listeners = new Set();
  }

  // ─── Initialize ────────────────────────────────────────
  async init() {
    // Try localStorage first (has user edits)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.products = JSON.parse(saved);
        this.loaded = true;
      } catch (e) {
        console.warn('Failed to parse saved products, loading from JSON');
      }
    }

    // Load from JSON if no saved data
    if (!this.loaded) {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}products.json`);
        const data = await res.json();
        this.products = data.products || [];
        this.loaded = true;
        this.save();
      } catch (e) {
        console.error('Failed to load products:', e);
        this.products = [];
      }
    }

    // Normalize text fields (decode entities) for clean display
    this.products = this.products.map(p => ({
      ...p,
      name: decodeEntities(p.name),
      brand: decodeEntities(p.brand),
      description: decodeEntities(p.description),
    }));

    // Load cart
    const cartSaved = localStorage.getItem(CART_KEY);
    if (cartSaved) {
      try { this.cart = JSON.parse(cartSaved); } catch (e) { this.cart = []; }
    }

    this.notify();
    return this.products;
  }

  // ─── CRUD Operations ──────────────────────────────────

  // READ - get all products
  getAll() {
    return this.products;
  }

  // READ - get by slug
  getBySlug(slug) {
    return this.products.find(p => p.slug === slug);
  }

  // READ - search & filter
  query({ search = '', gender = '', brand = '', type = '', concentration = '', sort = 'name-asc', minPrice = 0, maxPrice = Infinity, page = 1, perPage = 24 } = {}) {
    let results = [...this.products];

    // Search
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Filters
    if (gender) results = results.filter(p => p.gender === gender);
    if (brand) results = results.filter(p => p.brand === brand);
    if (type) results = results.filter(p => p.product_type === type);
    if (concentration) results = results.filter(p => (p.concentration || '').toLowerCase().includes(concentration.toLowerCase()));
    if (minPrice > 0) results = results.filter(p => this.parsePrice(p.price) >= minPrice);
    if (maxPrice < Infinity) results = results.filter(p => this.parsePrice(p.price) <= maxPrice);

    // Sort
    results.sort((a, b) => {
      switch (sort) {
        case 'price-asc': return this.parsePrice(a.price) - this.parsePrice(b.price);
        case 'price-desc': return this.parsePrice(b.price) - this.parsePrice(a.price);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'newest': return (b.lastmod || '').localeCompare(a.lastmod || '');
        case 'name-asc':
        default: return a.name.localeCompare(b.name);
      }
    });

    const total = results.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const paginated = results.slice(start, start + perPage);

    return { products: paginated, total, totalPages, page };
  }

  // CREATE
  create(product) {
    const slug = this.generateSlug(product.name);
    const newProduct = {
      slug,
      url: `#/product/${slug}`,
      name: product.name || '',
      brand: product.brand || '',
      price: String(product.price || '0'),
      currency: 'MMK',
      gender: product.gender || 'Unknown',
      product_type: product.product_type || 'Full Bottle',
      concentration: product.concentration || '',
      size: product.size || '',
      description: product.description || '',
      sku: product.sku || this.generateSKU(),
      in_stock: product.in_stock !== false,
      images: product.images || [],
      image_count: (product.images || []).length,
      lastmod: new Date().toISOString().split('T')[0],
      crawl_error: false,
    };
    this.products.unshift(newProduct);
    this.save();
    this.notify();
    return newProduct;
  }

  // UPDATE
  update(slug, updates) {
    const idx = this.products.findIndex(p => p.slug === slug);
    if (idx === -1) return null;
    this.products[idx] = { ...this.products[idx], ...updates, lastmod: new Date().toISOString().split('T')[0] };
    this.save();
    this.notify();
    return this.products[idx];
  }

  // DELETE
  delete(slug) {
    const idx = this.products.findIndex(p => p.slug === slug);
    if (idx === -1) return false;
    this.products.splice(idx, 1);
    this.save();
    this.notify();
    return true;
  }

  // ─── Cart Operations ──────────────────────────────────

  addToCart(slug, variant = null) {
    const product = this.getBySlug(slug);
    if (!product) return;
    const vid = variant?.id || 'base';
    const existing = this.cart.find(c => c.slug === slug && (c.variantId || 'base') === vid);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({
        slug, qty: 1,
        variantId: vid,
        variantLabel: variant?.label || null,
        variantSize: variant?.size || null,
        variantPrice: variant ? variant.price : null,
      });
    }
    this.saveCart();
    this.notify();
  }

  removeFromCart(slug, variantId = null) {
    this.cart = this.cart.filter(c => !(c.slug === slug && (variantId === null || (c.variantId || 'base') === variantId)));
    this.saveCart();
    this.notify();
  }

  updateCartQty(slug, qty, variantId = 'base') {
    const item = this.cart.find(c => c.slug === slug && (c.variantId || 'base') === variantId);
    if (item) {
      item.qty = Math.max(0, qty);
      if (item.qty === 0) this.removeFromCart(slug, variantId);
      else { this.saveCart(); this.notify(); }
    }
  }

  getCart() {
    return this.cart.map(c => {
      const product = this.getBySlug(c.slug);
      if (!product) return null;
      const price = c.variantPrice != null ? c.variantPrice : product.price;
      return { ...product, qty: c.qty, price, variantId: c.variantId || 'base', variantLabel: c.variantLabel, variantSize: c.variantSize };
    }).filter(Boolean);
  }

  getCartTotal() {
    return this.getCart().reduce((sum, item) => sum + this.parsePrice(item.price) * item.qty, 0);
  }

  getCartCount() {
    return this.cart.reduce((sum, c) => sum + c.qty, 0);
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.notify();
  }

  // ─── Aggregations ─────────────────────────────────────

  getBrands() {
    const brands = {};
    this.products.forEach(p => {
      const b = p.brand || 'Other';
      brands[b] = (brands[b] || 0) + 1;
    });
    return Object.entries(brands).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }

  getGenders() {
    const genders = {};
    this.products.forEach(p => {
      const g = p.gender || 'Unknown';
      genders[g] = (genders[g] || 0) + 1;
    });
    return Object.entries(genders).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }

  getTypes() {
    const types = {};
    this.products.forEach(p => {
      const t = p.product_type || 'Other';
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }

  getStats() {
    const prices = this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0);
    return {
      total: this.products.length,
      brands: this.getBrands().length,
      inStock: this.products.filter(p => p.in_stock).length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    };
  }

  // ─── Helpers ──────────────────────────────────────────

  parsePrice(price) {
    return parseInt(String(price || '0').replace(/[^0-9]/g, ''), 10) || 0;
  }

  formatPrice(price) {
    const num = this.parsePrice(price);
    return num.toLocaleString();
  }

  generateSlug(name) {
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // Ensure unique
    let counter = 1;
    let candidate = slug;
    while (this.products.some(p => p.slug === candidate)) {
      candidate = `${slug}-${counter++}`;
    }
    return candidate;
  }

  generateSKU() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sku = '';
    for (let i = 0; i < 8; i++) sku += chars[Math.floor(Math.random() * chars.length)];
    return sku;
  }

  // Resolve an image entry (string URL or crawled {contentUrl} object) to a URL.
  // Optionally upgrade the Wix CDN transform to a target width for crisp hero/gallery views.
  imageUrl(entry, width) {
    let url = '';
    if (typeof entry === 'string') url = entry;
    else if (entry && typeof entry === 'object') url = entry.contentUrl || entry.url || entry.src || '';
    if (!url) return this.placeholderImage();
    if (width && url.includes('static.wixstatic.com')) {
      // Rewrite Wix fit/fill transform: /v1/fit/w_500,h_500,q_90/ -> requested width
      url = url.replace(/\/v1\/(fit|fill)\/w_\d+,h_\d+/, `/v1/fill/w_${width},h_${width}`);
    }
    return url;
  }

  placeholderImage() {
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" fill="%23F8E8E0"><rect width="400" height="500"/><text x="200" y="250" text-anchor="middle" fill="%23B76E79" font-size="48">🌸</text></svg>');
  }

  getProductImage(product, index = 0, width) {
    const images = product.images || [];
    if (images.length > index) return this.imageUrl(images[index], width);
    if (images.length > 0) return this.imageUrl(images[0], width);
    return this.placeholderImage();
  }

  // Resolved, de-duplicated list of image URLs for a product gallery.
  getImageUrls(product, width, max = 12) {
    const seen = new Set();
    const urls = [];
    for (const entry of (product.images || [])) {
      const u = this.imageUrl(entry, width);
      const key = this.imageUrl(entry); // de-dupe on the base url
      if (u && !seen.has(key)) { seen.add(key); urls.push(u); }
      if (urls.length >= max) break;
    }
    if (!urls.length) urls.push(this.placeholderImage());
    return urls;
  }

  // ─── Variants (size options) ──────────────────────────────
  parseSizeMl(sizeStr) {
    const m = String(sizeStr || '').match(/(\d+)\s*ml/i);
    return m ? parseInt(m[1], 10) : 0;
  }

  // Synthesize believable size variants. The product's real size is the
  // default/recommended option; alternates are price-estimated by volume
  // (decants cost more per-ml). Orders are confirmed via Viber regardless.
  getVariants(product) {
    const base = this.parsePrice(product.price);
    const baseMl = this.parseSizeMl(product.size) || 100;
    const type = product.product_type || 'Full Bottle';
    const round = (n) => Math.max(1000, Math.round(n / 1000) * 1000);
    const realLabel = product.size || `${baseMl}ml`;

    // Already a small format (decant/tester/sample) → offer its size + a full bottle.
    if (/decant|tester|sample/i.test(type) || baseMl <= 30) {
      const fullMl = baseMl <= 30 ? 100 : Math.max(baseMl * 2, 100);
      return [
        { id: 'base', label: realLabel || `${baseMl}ml`, size: realLabel, type, price: base, real: true, default: true, badge: 'In stock' },
        { id: 'full', label: `${fullMl}ml Full Bottle`, size: `${fullMl}ml`, type: 'Full Bottle', price: round(base * (fullMl / Math.max(baseMl, 5)) * 0.62), badge: 'Sealed' },
      ];
    }

    // Full bottle → offer a try-it decant, an optional mid size, and the full bottle (default).
    const variants = [];
    variants.push({ id: 'decant', label: '10ml Decant', size: '10ml', type: 'Decant', price: round(base * (10 / baseMl) * 1.7), badge: 'Try it' });
    if (baseMl >= 90) {
      variants.push({ id: 'mid', label: '50ml', size: '50ml', type: 'Full Bottle', price: round(base * 0.62), badge: 'Popular' });
    }
    variants.push({ id: 'base', label: `${realLabel} Full Bottle`, size: realLabel, type: 'Full Bottle', price: base, real: true, default: true, badge: 'Best value' });
    return variants;
  }

  // ─── Persistence ──────────────────────────────────────

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
    } catch (e) {
      console.warn('Failed to save products to localStorage:', e);
    }
  }

  saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
    } catch (e) {
      console.warn('Failed to save cart:', e);
    }
  }

  // Reset to original crawled data
  async reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.loaded = false;
    await this.init();
  }

  // Export as JSON
  export() {
    return JSON.stringify({ products: this.products }, null, 2);
  }

  // Import from JSON
  import(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.products)) {
        this.products = data.products;
        this.save();
        this.notify();
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ─── Subscribers ──────────────────────────────────────

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const store = new Store();
