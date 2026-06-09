/* ═══════════════════════════════════════════════════════════
   PHAUNG PERFUME — Hash-based SPA Router
   ═══════════════════════════════════════════════════════════ */

import { initImmersive } from './immersive.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeEach = null;
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  add(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const app = document.getElementById('app');

    // Find matching route (supports params like /product/:slug)
    let handler = null;
    let params = {};

    for (const [pattern, h] of this.routes) {
      const match = this.matchRoute(pattern, hash);
      if (match) {
        handler = h;
        params = match;
        break;
      }
    }

    if (!handler) {
      handler = this.routes.get('*') || this.routes.get('/');
    }

    if (handler) {
      this.currentRoute = hash;
      if (this.beforeEach) this.beforeEach(hash);

      // Scroll to top
      window.scrollTo(0, 0);

      handler(params);

      // Opacity-only route fade (transforms would break the fixed navbar)
      const app = document.getElementById('app');
      if (app) {
        app.classList.remove('route-fade');
        void app.offsetWidth; // restart animation
        app.classList.add('route-fade');
      }

      // Reveals, hero parallax, back-to-top — for every page
      initImmersive();
    }
  }

  matchRoute(pattern, hash) {
    const patternParts = pattern.split('/');
    const hashParts = hash.split('/');

    if (patternParts.length !== hashParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return params;
  }

  getCurrentPath() {
    return window.location.hash.slice(1) || '/';
  }
}

export const router = new Router();
