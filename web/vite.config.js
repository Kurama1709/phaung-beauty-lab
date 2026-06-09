import { defineConfig } from 'vite'

// Relative base ('./') so the build works under any GitHub Pages path
// (https://<user>.github.io/<repo>/) without hardcoding the repo name.
// All runtime asset lookups use import.meta.env.BASE_URL to match.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
