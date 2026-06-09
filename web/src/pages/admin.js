/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Admin Panel (Full CRUD)
   ═══════════════════════════════════════════════════════════ */
import { store } from '../store.js';
import { renderNavbar, initNavbar, renderFooter, showToast, showModal, showConfirm, refreshIcons } from '../components/components.js';
import { initImmersive } from '../immersive.js';

const STAT_META = [
  { key: 'total', label: 'Total Products', icon: 'package', color: 'var(--forest)' },
  { key: 'brands', label: 'Unique Brands', icon: 'crown', color: 'var(--gold-deep)' },
  { key: 'inStock', label: 'In Stock', icon: 'check-circle', color: 'var(--olive)' },
  { key: 'avgPrice', label: 'Avg Price', icon: 'tag', color: 'var(--rose)', money: true },
];

let adminSearch = '';
let adminPage = 1;
const ADMIN_PER_PAGE = 15;

export function renderAdmin() {
  adminSearch = '';      // always start showing the full catalog
  adminPage = 1;
  const stats = store.getStats();
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderNavbar()}

    <div style="padding-top:calc(var(--nav-height) + 1.5rem);min-height:100vh">
      <div class="container">
        <div class="admin-header reveal">
          <div class="scene-divider"><i data-lucide="sparkles" style="width:18px;height:18px"></i></div>
          <div class="section-eyebrow" style="color:var(--gold-deep)">Phaung's Beauty Lab</div>
          <h1 class="heading-lg">Catalog Manager</h1>
          <p class="text-muted">Create, edit, and curate your fragrance collection</p>
        </div>

        <!-- Stats -->
        <div class="admin-stats reveal-children">
          ${STAT_META.map(m => `
            <div class="admin-stat-card" style="--stat-color:${m.color}">
              <div class="admin-stat-top">
                <span class="admin-stat-label">${m.label}</span>
                <span class="admin-stat-icon"><i data-lucide="${m.icon}" style="width:16px;height:16px"></i></span>
              </div>
              <div class="admin-stat-value" style="color:${m.color}">${m.money ? 'MMK ' + store.formatPrice(stats[m.key]) : stats[m.key]}</div>
            </div>
          `).join('')}
        </div>

        <!-- Toolbar -->
        <div class="admin-toolbar">
          <div class="flex gap-sm items-center" style="flex:1">
            <div style="position:relative;flex:1;max-width:350px">
              <i data-lucide="search" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-light);pointer-events:none"></i>
              <input type="text" class="input input-search" placeholder="Search products..." id="admin-search" value="${adminSearch}" />
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-primary" id="add-product-btn">
              <i data-lucide="plus" style="width:16px;height:16px"></i>
              Add Product
            </button>
            <button class="btn btn-ghost" id="export-btn">
              <i data-lucide="download" style="width:16px;height:16px"></i>
              Export
            </button>
            <button class="btn btn-ghost" id="import-btn">
              <i data-lucide="upload" style="width:16px;height:16px"></i>
              Import
            </button>
            <button class="btn btn-ghost" id="reset-btn" style="color:var(--rose)">
              <i data-lucide="rotate-ccw" style="width:16px;height:16px"></i>
              Reset
            </button>
          </div>
        </div>

        <!-- Product Table -->
        <div id="admin-table-container"></div>
      </div>
    </div>

    ${renderFooter()}
  `;

  initNavbar();
  refreshIcons();
  renderAdminTable();
  initAdminEvents();
  initImmersive();
}

function renderAdminTable() {
  const allProducts = store.getAll();
  let filtered = allProducts;
  if (adminSearch) {
    const q = adminSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / ADMIN_PER_PAGE);
  adminPage = Math.min(adminPage, totalPages || 1);
  const start = (adminPage - 1) * ADMIN_PER_PAGE;
  const pageProducts = filtered.slice(start, start + ADMIN_PER_PAGE);

  const container = document.getElementById('admin-table-container');
  if (!container) return;

  container.innerHTML = `
    <div class="admin-list">
      ${pageProducts.map(p => `
        <div class="admin-item">
          <div class="admin-item-thumb">
            <img src="${store.getProductImage(p, 0, 200)}" alt="" loading="lazy"
                 onerror="this.src='data:image/svg+xml,${encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\" fill=\"%23F8E8E0\"><rect width=\"80\" height=\"80\"/><text x=\"40\" y=\"48\" text-anchor=\"middle\" fill=\"%23B76E79\" font-size=\"28\">🌸</text></svg>')}'" />
          </div>
          <div class="admin-item-body">
            <a href="#/product/${p.slug}" class="admin-item-name">${truncate(p.name, 70)}</a>
            <div class="admin-item-meta">
              ${p.brand ? `<span class="admin-chip admin-chip-brand">${p.brand}</span>` : ''}
              ${p.gender && p.gender !== 'Unknown' ? `<span class="admin-chip">${p.gender}</span>` : ''}
              ${p.product_type ? `<span class="admin-chip">${p.product_type}</span>` : ''}
              ${p.size ? `<span class="admin-chip">${p.size}</span>` : ''}
              ${p.in_stock ? '<span class="badge badge-success">In stock</span>' : '<span class="badge badge-danger">Sold out</span>'}
            </div>
            ${p.sku ? `<div class="admin-item-sku">SKU ${p.sku}</div>` : ''}
          </div>
          <div class="admin-item-side">
            <div class="admin-item-price">MMK ${store.formatPrice(p.price)}</div>
            <div class="admin-actions">
              <a class="btn btn-icon btn-ghost" href="#/product/${p.slug}" title="View" aria-label="View">
                <i data-lucide="eye" style="width:15px;height:15px"></i>
              </a>
              <button class="btn btn-icon btn-ghost" data-edit="${p.slug}" title="Edit" aria-label="Edit">
                <i data-lucide="pencil" style="width:15px;height:15px"></i>
              </button>
              <button class="btn btn-icon btn-ghost admin-del" data-delete="${p.slug}" title="Delete" aria-label="Delete">
                <i data-lucide="trash-2" style="width:15px;height:15px"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Pagination -->
    <div class="admin-pagination flex items-center justify-between" style="margin-top:1.25rem">
      <span class="text-sm text-muted">Showing ${start + 1}–${Math.min(start + ADMIN_PER_PAGE, total)} of ${total}</span>
      <div class="flex gap-xs">
        <button class="btn btn-sm btn-ghost ${adminPage <= 1 ? 'disabled' : ''}" id="admin-prev" ${adminPage <= 1 ? 'disabled' : ''}>
          <i data-lucide="chevron-left" style="width:14px;height:14px"></i> Prev
        </button>
        <span class="text-sm" style="padding:0.5rem">Page ${adminPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-ghost ${adminPage >= totalPages ? 'disabled' : ''}" id="admin-next" ${adminPage >= totalPages ? 'disabled' : ''}>
          Next <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
        </button>
      </div>
    </div>
  `;

  refreshIcons();

  // Edit buttons
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => showProductForm(btn.dataset.edit));
  });

  // Delete buttons
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await showConfirm('Are you sure you want to delete this product?');
      if (confirmed) {
        store.delete(btn.dataset.delete);
        showToast('Product deleted', 'error');
        renderAdminTable();
      }
    });
  });

  // Pagination
  const prevBtn = document.getElementById('admin-prev');
  const nextBtn = document.getElementById('admin-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { adminPage--; renderAdminTable(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { adminPage++; renderAdminTable(); });
}

function initAdminEvents() {
  // Search
  const searchInput = document.getElementById('admin-search');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        adminSearch = searchInput.value;
        adminPage = 1;
        renderAdminTable();
      }, 300);
    });
  }

  // Add product
  document.getElementById('add-product-btn')?.addEventListener('click', () => showProductForm());

  // Export
  document.getElementById('export-btn')?.addEventListener('click', () => {
    const json = store.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'phaung-beauty-lab-products.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Products exported! 📦');
  });

  // Import
  document.getElementById('import-btn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (store.import(ev.target.result)) {
          showToast('Products imported! ✅');
          renderAdmin();
        } else {
          showToast('Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  // Reset
  document.getElementById('reset-btn')?.addEventListener('click', async () => {
    const confirmed = await showConfirm('This will reset all products to the original crawled data. Continue?');
    if (confirmed) {
      await store.reset();
      showToast('Products reset to original data');
      renderAdmin();
    }
  });
}

async function showProductForm(slug = null) {
  const isEdit = !!slug;
  const product = isEdit ? store.getBySlug(slug) : {};
  const brands = store.getBrands().map(b => b.name).filter(b => b !== 'Other');

  const formHTML = `
    <div class="form-grid">
      <div class="form-group full-width">
        <label class="label">Product Name *</label>
        <input type="text" class="input" id="form-name" value="${product.name || ''}" placeholder="e.g. Chanel No. 5 Eau de Parfum 100ml" required />
      </div>
      <div class="form-group">
        <label class="label">Brand</label>
        <input type="text" class="input" id="form-brand" value="${product.brand || ''}" placeholder="e.g. Chanel" list="brand-list" />
        <datalist id="brand-list">
          ${brands.map(b => `<option value="${b}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="label">Price (MMK)</label>
        <input type="number" class="input" id="form-price" value="${product.price || ''}" placeholder="e.g. 189000" />
      </div>
      <div class="form-group">
        <label class="label">Gender</label>
        <select class="select" id="form-gender">
          <option value="Men" ${product.gender === 'Men' ? 'selected' : ''}>Men</option>
          <option value="Women" ${product.gender === 'Women' ? 'selected' : ''}>Women</option>
          <option value="Unisex" ${product.gender === 'Unisex' ? 'selected' : ''}>Unisex</option>
          <option value="Unknown" ${product.gender === 'Unknown' || !product.gender ? 'selected' : ''}>Unknown</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">Product Type</label>
        <select class="select" id="form-type">
          <option value="Full Bottle" ${product.product_type === 'Full Bottle' ? 'selected' : ''}>Full Bottle</option>
          <option value="Decant" ${product.product_type === 'Decant' ? 'selected' : ''}>Decant</option>
          <option value="Tester" ${product.product_type === 'Tester' ? 'selected' : ''}>Tester</option>
          <option value="Gift Set" ${product.product_type === 'Gift Set' ? 'selected' : ''}>Gift Set</option>
          <option value="Deodorant" ${product.product_type === 'Deodorant' ? 'selected' : ''}>Deodorant</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">Concentration</label>
        <select class="select" id="form-concentration">
          <option value="Eau de Parfum" ${(product.concentration || '').includes('Parfum') ? 'selected' : ''}>Eau de Parfum</option>
          <option value="Eau de Toilette" ${(product.concentration || '').includes('Toilette') ? 'selected' : ''}>Eau de Toilette</option>
          <option value="Extrait de Parfum" ${(product.concentration || '').includes('Extrait') ? 'selected' : ''}>Extrait de Parfum</option>
          <option value="Cologne" ${(product.concentration || '').includes('Cologne') ? 'selected' : ''}>Cologne</option>
          <option value="" ${!product.concentration ? 'selected' : ''}>Not specified</option>
        </select>
      </div>
      <div class="form-group">
        <label class="label">Size</label>
        <input type="text" class="input" id="form-size" value="${product.size || ''}" placeholder="e.g. 100ml" />
      </div>
      <div class="form-group">
        <label class="label">In Stock</label>
        <select class="select" id="form-stock">
          <option value="true" ${product.in_stock !== false ? 'selected' : ''}>Yes</option>
          <option value="false" ${product.in_stock === false ? 'selected' : ''}>No</option>
        </select>
      </div>
      <div class="form-group full-width">
        <label class="label">Image URLs (one per line)</label>
        <textarea class="textarea" id="form-images" rows="3" placeholder="https://static.wixstatic.com/media/...">${(product.images || []).map(im => store.imageUrl(im)).join('\n')}</textarea>
      </div>
      <div class="form-group full-width">
        <label class="label">Description</label>
        <textarea class="textarea" id="form-description" rows="5" placeholder="Product description...">${product.description || ''}</textarea>
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-ghost" data-close>Cancel</button>
    <button class="btn btn-primary" id="form-save">${isEdit ? 'Update Product' : 'Create Product'}</button>
  `;

  const { overlay, close } = await showModal(
    isEdit ? 'Edit Product' : 'Add New Product',
    formHTML,
    footerHTML
  );

  // Save handler
  document.getElementById('form-save')?.addEventListener('click', () => {
    const name = document.getElementById('form-name').value.trim();
    if (!name) { showToast('Product name is required', 'error'); return; }

    const data = {
      name,
      brand: document.getElementById('form-brand').value.trim(),
      price: document.getElementById('form-price').value,
      gender: document.getElementById('form-gender').value,
      product_type: document.getElementById('form-type').value,
      concentration: document.getElementById('form-concentration').value,
      size: document.getElementById('form-size').value.trim(),
      in_stock: document.getElementById('form-stock').value === 'true',
      images: document.getElementById('form-images').value.split('\n').map(s => s.trim()).filter(Boolean),
      description: document.getElementById('form-description').value.trim(),
    };

    if (isEdit) {
      store.update(slug, data);
      showToast('Product updated! ✅');
    } else {
      store.create(data);
      showToast('Product created! 🎉');
    }

    close();
    renderAdminTable();
  });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}
