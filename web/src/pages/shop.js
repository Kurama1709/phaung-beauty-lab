/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Shop Page (Full Catalog + Filters)
   ═══════════════════════════════════════════════════════════ */
import { store } from '../store.js';
import { router } from '../router.js';
import { renderNavbar, initNavbar, renderProductCard, initProductCards, renderPagination, initPagination, renderFooter, refreshIcons } from '../components/components.js';

let currentFilters = { search: '', gender: '', brand: '', type: '', sort: 'name-asc', page: 1 };
let filtersOpen = false;

let skipUrlParse = false; // true for in-page re-renders (state is the source, not the URL)

function rerenderShop() { skipUrlParse = true; renderShop(); skipUrlParse = false; }

export function renderShop(params = {}) {
  // On navigation, the URL query is the source of truth (resets stale filters).
  if (!skipUrlParse) {
    const q = window.location.hash.split('?')[1] || '';
    const p = new URLSearchParams(q);
    currentFilters.search = p.get('search') || '';
    currentFilters.gender = p.get('gender') || '';
    currentFilters.brand = p.get('brand') || '';
    currentFilters.type = p.get('type') || '';
    currentFilters.page = 1;
  }

  const brands = store.getBrands().filter(b => b.name !== 'Other');
  const genders = store.getGenders();
  const types = store.getTypes();

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}

    <div style="padding-top:calc(var(--nav-height) + 1.5rem)">
      <div class="container">
        <!-- Page Header -->
        <div class="shop-banner reveal">
          <div class="scene-divider"><i data-lucide="flower-2" style="width:18px;height:18px"></i></div>
          <div class="section-eyebrow" style="color:var(--gold-deep)">Phaung's Beauty Lab</div>
          <h1 class="heading-lg">Our Collection</h1>
          <p class="text-muted" style="margin-top:0.25rem">Browse ${store.getAll().length} genuine branded fragrances</p>
        </div>

        <!-- Mobile Filter Toggle -->
        <button class="filter-toggle-mobile" id="filter-toggle">
          <i data-lucide="sliders-horizontal" style="width:16px;height:16px"></i>
          Filters ${currentFilters.gender || currentFilters.brand || currentFilters.type ? '•' : ''}
        </button>

        <div class="shop-layout">
          <!-- Filters Sidebar -->
          <aside class="filters-sidebar ${filtersOpen ? 'open' : ''}" id="filters-sidebar">
            <!-- Active Filters -->
            ${(currentFilters.gender || currentFilters.brand || currentFilters.type || currentFilters.search) ? `
              <div style="margin-bottom:1.5rem">
                <div class="flex items-center justify-between" style="margin-bottom:0.5rem">
                  <span class="text-sm font-display" style="font-weight:600">Active Filters</span>
                  <button class="filter-clear" id="clear-all-filters">Clear All</button>
                </div>
                <div class="flex flex-wrap gap-xs">
                  ${currentFilters.search ? `<span class="badge">"${currentFilters.search}" <button data-clear="search" style="margin-left:4px;cursor:pointer;background:none;border:none;color:inherit">×</button></span>` : ''}
                  ${currentFilters.gender ? `<span class="badge">${currentFilters.gender} <button data-clear="gender" style="margin-left:4px;cursor:pointer;background:none;border:none;color:inherit">×</button></span>` : ''}
                  ${currentFilters.brand ? `<span class="badge">${currentFilters.brand} <button data-clear="brand" style="margin-left:4px;cursor:pointer;background:none;border:none;color:inherit">×</button></span>` : ''}
                  ${currentFilters.type ? `<span class="badge">${currentFilters.type} <button data-clear="type" style="margin-left:4px;cursor:pointer;background:none;border:none;color:inherit">×</button></span>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Search -->
            <div class="filter-group">
              <div class="filter-group-title">Search</div>
              <div style="position:relative">
                <i data-lucide="search" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-light);pointer-events:none"></i>
                <input type="text" class="input input-search" placeholder="Search..." id="shop-search" value="${currentFilters.search}" />
              </div>
            </div>

            <!-- Gender -->
            <div class="filter-group">
              <div class="filter-group-title">Gender</div>
              ${genders.filter(g => g.name !== 'Unknown').map(g => `
                <label class="filter-option">
                  <input type="radio" name="gender" value="${g.name}" ${currentFilters.gender === g.name ? 'checked' : ''} />
                  ${g.name}
                  <span class="count">${g.count}</span>
                </label>
              `).join('')}
              <label class="filter-option">
                <input type="radio" name="gender" value="" ${!currentFilters.gender ? 'checked' : ''} />
                All Genders
              </label>
            </div>

            <!-- Type -->
            <div class="filter-group">
              <div class="filter-group-title">Type</div>
              ${types.map(t => `
                <label class="filter-option">
                  <input type="radio" name="type" value="${t.name}" ${currentFilters.type === t.name ? 'checked' : ''} />
                  ${t.name}
                  <span class="count">${t.count}</span>
                </label>
              `).join('')}
              <label class="filter-option">
                <input type="radio" name="type" value="" ${!currentFilters.type ? 'checked' : ''} />
                All Types
              </label>
            </div>

            <!-- Brand -->
            <div class="filter-group">
              <div class="filter-group-title">Brand</div>
              <div style="max-height:300px;overflow-y:auto">
                <label class="filter-option">
                  <input type="radio" name="brand" value="" ${!currentFilters.brand ? 'checked' : ''} />
                  All Brands
                </label>
                ${brands.slice(0, 30).map(b => `
                  <label class="filter-option">
                    <input type="radio" name="brand" value="${b.name}" ${currentFilters.brand === b.name ? 'checked' : ''} />
                    ${b.name}
                    <span class="count">${b.count}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </aside>

          <!-- Products Grid -->
          <div class="shop-main">
            <div id="shop-products"></div>
          </div>
        </div>
      </div>
    </div>

    ${renderFooter()}
  `;

  initNavbar();
  refreshIcons();
  renderProducts();
  initShopEvents();
}

function renderProducts() {
  const result = store.query({ ...currentFilters, perPage: 24 });
  const container = document.getElementById('shop-products');
  if (!container) return;

  container.innerHTML = `
    <div class="products-header">
      <span class="products-count">${result.total} product${result.total !== 1 ? 's' : ''} found</span>
      <div class="products-sort">
        <label>Sort by:</label>
        <select class="select" id="sort-select" style="width:auto;padding:0.5rem 2rem 0.5rem 0.75rem;font-size:0.8rem">
          <option value="name-asc" ${currentFilters.sort === 'name-asc' ? 'selected' : ''}>Name A-Z</option>
          <option value="name-desc" ${currentFilters.sort === 'name-desc' ? 'selected' : ''}>Name Z-A</option>
          <option value="price-asc" ${currentFilters.sort === 'price-asc' ? 'selected' : ''}>Price: Low → High</option>
          <option value="price-desc" ${currentFilters.sort === 'price-desc' ? 'selected' : ''}>Price: High → Low</option>
          <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Newest</option>
        </select>
      </div>
    </div>

    ${result.products.length === 0 ? `
      <div class="empty-state">
        <div style="font-size:4rem">🔍</div>
        <div class="empty-state-title">No perfumes found</div>
        <p class="text-sm text-muted">Try adjusting your filters or search term</p>
        <button class="btn btn-secondary btn-sm" id="reset-filters" style="margin-top:1rem">Reset Filters</button>
      </div>
    ` : `
      <div class="products-grid stagger" id="products-grid">
        ${result.products.map(p => renderProductCard(p)).join('')}
      </div>
    `}

    ${renderPagination(result.page, result.totalPages)}
  `;

  initProductCards(document.getElementById('products-grid'));
  initPagination((page) => { currentFilters.page = page; renderProducts(); window.scrollTo(0, 200); });
  refreshIcons();

  // Sort handler
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', () => { currentFilters.sort = sortSelect.value; currentFilters.page = 1; renderProducts(); });

  // Reset filters
  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) resetBtn.addEventListener('click', () => { currentFilters = { search: '', gender: '', brand: '', type: '', sort: 'name-asc', page: 1 }; rerenderShop(); });
}

function initShopEvents() {
  // Search
  const searchInput = document.getElementById('shop-search');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentFilters.search = searchInput.value;
        currentFilters.page = 1;
        renderProducts();
      }, 300);
    });
  }

  // Gender
  document.querySelectorAll('input[name="gender"]').forEach(r => {
    r.addEventListener('change', () => { currentFilters.gender = r.value; currentFilters.page = 1; renderProducts(); });
  });

  // Type
  document.querySelectorAll('input[name="type"]').forEach(r => {
    r.addEventListener('change', () => { currentFilters.type = r.value; currentFilters.page = 1; renderProducts(); });
  });

  // Brand
  document.querySelectorAll('input[name="brand"]').forEach(r => {
    r.addEventListener('change', () => { currentFilters.brand = r.value; currentFilters.page = 1; renderProducts(); });
  });

  // Clear individual filters
  document.querySelectorAll('[data-clear]').forEach(btn => {
    btn.addEventListener('click', () => { currentFilters[btn.dataset.clear] = ''; currentFilters.page = 1; rerenderShop(); });
  });

  // Clear all filters
  const clearAll = document.getElementById('clear-all-filters');
  if (clearAll) clearAll.addEventListener('click', () => { currentFilters = { search: '', gender: '', brand: '', type: '', sort: 'name-asc', page: 1 }; rerenderShop(); });

  // Mobile filter toggle
  const filterToggle = document.getElementById('filter-toggle');
  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      filtersOpen = !filtersOpen;
      const sidebar = document.getElementById('filters-sidebar');
      if (sidebar) sidebar.classList.toggle('open', filtersOpen);
    });
  }
}
