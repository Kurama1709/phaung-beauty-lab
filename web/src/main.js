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

  // Show loading spinner
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <div style="font-size:3rem;animation:float 2s ease-in-out infinite">🌸</div>
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
