import './styles/index.css'
import './styles/components.css'
import './styles/immersive.css'
import './styles/responsive.css'
import { store } from './store.js'
import { router } from './router.js'

import { renderHome } from './pages/home.js'
import { renderShop } from './pages/shop.js'
import { renderProduct } from './pages/product.js'
import { renderAdmin } from './pages/admin.js'
import { renderAbout } from './pages/about.js'

async function init() {
  // SPA controls its own scroll — don't let the browser restore on reload
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Show branded loading screen
  document.getElementById('app').innerHTML = `
    <div class="app-loader">
      <div class="app-loader-logo">
        <img src="${import.meta.env.BASE_URL}logo.jpg" alt="Phaung's Beauty Lab" />
        <span class="app-loader-ring"></span>
      </div>
      <div class="app-loader-name">Phaung's Beauty Lab</div>
      <div class="app-loader-sub">Beauty · Fragrance</div>
    </div>
  `;

  // Initialize store (loads from localStorage or products.json)
  await store.init();

  // Setup routes
  router
    .add('/', renderHome)
    .add('/shop', renderShop)
    .add('/product/:slug', renderProduct)
    .add('/admin', renderAdmin)
    .add('/about', renderAbout);

  // Initial render
  router.handleRoute();
}

// Start app
init();
