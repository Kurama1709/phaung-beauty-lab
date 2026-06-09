# Deploying Phaung's Beauty Lab to GitHub Pages

The site is a static Vite SPA (in `web/`) with hash-based routing, so it runs
perfectly on GitHub Pages — no server needed. A GitHub Actions workflow builds
and publishes it automatically on every push to `main`.

## One-time setup

1. **Create a repo on GitHub** (e.g. `phaung-beauty-lab`). Don't add a README/license (this folder already has files).

2. **Connect this folder and push** (run from the project root):
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. **Enable Pages**: on GitHub → your repo → **Settings → Pages** →
   under **Build and deployment → Source**, choose **GitHub Actions**.

That's it. The `Deploy to GitHub Pages` workflow (`.github/workflows/deploy.yml`)
runs automatically. When it finishes (Actions tab → green check), your site is live at:

```
https://<your-username>.github.io/<your-repo>/
```

## Updating the site

Just commit and push to `main` — it redeploys automatically:
```bash
git add -A
git commit -m "Update products"
git push
```

## Notes
- `vite.config.js` uses `base: './'` (relative paths), so it works under the
  `/<repo>/` subpath without hardcoding the repo name.
- Product data lives in `web/public/products.json`. Edit it directly, or use the
  in-app **Admin → Export** to download an updated file and replace it.
- Product photos load from the original Wix CDN (no image hosting needed).
- To preview the production build locally: `cd web && npm run build && npm run preview`.
