# Phaung's Beauty Lab — Immersive Redesign Brief & Prompt

> Copy any section below into Claude (or any AI coding assistant) as a prompt.
> The **"MASTER PROMPT"** at the bottom is the all-in-one version.

---

## 0. Context (always include this)

**Project:** `Phaung's Beauty Lab` — an elegant, girly + nature-inspired luxury
**perfume e-commerce** site for a Myanmar boutique. Live at
https://phaungbeautylab.netlify.app (Netlify), source in `web/`.

**Stack (do NOT change):** Vite + **vanilla JS + CSS** (no React/Vue/Tailwind).
Hash-based SPA router. Data: `web/public/products.json` (662 products, MMK
prices, bilingual MY/EN). Lucide icons via CDN. Orders happen over **Viber**
(no real checkout).

**Files:**
- `src/main.js` (boot + loader), `src/router.js` (hash router, matches path only),
  `src/store.js` (products + cart + variants, localStorage).
- `src/pages/`: `home.js`, `shop.js`, `product.js`, `about.js`, `admin.js`.
- `src/components/components.js` (navbar, footer, cart, product card, toasts, modal).
- `src/immersive.js` (scroll-reveal, hero parallax, back-to-top).
- `src/styles/`: `index.css` (design tokens), `components.css`, `immersive.css`, `responsive.css`.

**Design tokens (keep the palette):**
- Rose `#B76E79`, rose-dark `#8B4F57`, blush `#F8E8E0`, cream `#FFF8F0`
- Plum `#2D1B2E`; **botanical** forest `#2F3D2C`, olive `#6B7A5A`, sage-soft `#DCE3D4`
- Gold `#C6A363`, gold-deep `#A8853F`
- Fonts: **Playfair Display** (headings), **Inter** (body), **Cormorant Garamond** (accents)

**Hard rules:**
- Mobile-first AND laptop-polished. No horizontal overflow ever (use `minmax(0,1fr)` in grids).
- Honor `prefers-reduced-motion` — every animation must have a reduced/none fallback.
- 60fps: animate only `transform` and `opacity`; never animate layout props.
- Keep it lightweight (no heavy 3D libs); CSS + small vanilla JS only.
- Don't break the fixed navbar (no `transform`/`filter` on `#app` ancestors).

---

## 1. Goal

Make the whole site feel **immersive, premium, and delightful to shop** — with
**catchy, tasteful micro-animations** on both mobile and laptop. Think a
high-end perfume house: soft, dreamy, alive, but never gaudy or slow.

---

## 2. Page-by-page animation upgrades

### Global
- **Page transitions:** a soft cross-fade + slight rise between routes (opacity only on `#app`).
- **Scroll-reveal:** sections fade/rise in (already present) — extend with **stagger** on grids and a subtle blur-in.
- **Magnetic / tilt buttons:** primary CTAs gently scale + glow on hover; on tap, a soft ripple.
- **Cursor-follow glow** (laptop only): a faint rose halo trailing the cursor on hero/CTA areas.
- **Sticky add-to-cart bar** on product pages (mobile): slides up when the main button scrolls away.
- **Cart fly-to-bag:** when "Add to Bag" is tapped, a small product image animates into the cart icon; cart badge bounces.
- **Toast polish:** slide + soft bounce, auto-stack.

### Home / Hero
- Keep the floating 3D bottle cluster + parallax. Add: bottles **drift on scroll** (depth parallax), gentle **breathing** scale, and a **shimmer sweep** across the headline gradient on load.
- **Scroll-snap "scenes"**: category → featured → brands → ethos banner each animate in as a distinct "scene."
- Petals: keep soft; add a few that react subtly to cursor on laptop.

### Shop
- Product cards: **3D tilt on hover** (laptop), image **Ken-Burns zoom**, price + "Add to Bag" reveal with stagger.
- Filter changes: cards **fade-shuffle** (FLIP-style) instead of hard re-render.
- Skeleton shimmer while images load.
- Mobile: filters in a **bottom-sheet** drawer that slides up.

### Product detail
- Gallery: keep prev/next + thumbnails + full-screen zoom. Add **slide/fade** between images, **pinch-to-zoom** on mobile, and a thumbnail **active-glow**.
- Variant pills: selecting one does a **springy pop** + price **count-up** animation.
- Description "Read more": smooth height expand.

### About
- Founder banner: parallax + soft reveal; an elegant **animated underline** on the quote.

### Navbar / Footer
- Navbar: frosted, hides on scroll-down (present) — add a thin **gradient progress line** showing scroll depth.
- Footer: keep compact accordions; add a gentle reveal.

---

## 3. Signature "wow" moments (pick 3–4, don't overdo)
1. **Hero headline shimmer** on load + on scroll-into-view.
2. **Cart fly-to-bag** micro-animation.
3. **3D tilt product cards** (laptop) / **press-scale** (mobile).
4. **Variant pop + price count-up.**
5. **Scroll progress line** under the navbar.

---

## 4. Deliverable format (ask the assistant for this)
- Implement as **incremental, reviewable edits** to the existing files (don't rewrite from scratch).
- New animation helpers in `src/immersive.js`; new styles in `src/styles/immersive.css`.
- Each effect: add a CSS class + a small JS initializer; guard with `prefers-reduced-motion`.
- After each batch: run `npm run build` and verify no console errors + no horizontal overflow at 375px and 1440px.
- Keep total JS/CSS lean (current: ~19KB JS gz / ~11KB CSS gz).

---

## 5. MASTER PROMPT (all-in-one — paste this)

> You are upgrading **Phaung's Beauty Lab**, an elegant girly + nature-inspired
> luxury **perfume** SPA built with **Vite + vanilla JS + CSS** (no frameworks),
> hash router, data in `web/public/products.json`. Files: `src/pages/*`,
> `src/components/components.js`, `src/immersive.js`, `src/styles/*`. Palette:
> rose #B76E79, blush #F8E8E0, cream #FFF8F0, plum #2D1B2E, forest #2F3D2C,
> olive #6B7A5A, gold #C6A363; fonts Playfair Display + Inter + Cormorant.
>
> Goal: make the **whole site immersive, premium, and delightful to shop on
> both mobile and laptop**, with **catchy but tasteful micro-animations**.
> Implement these, as incremental edits to the existing files (don't rewrite):
> (1) soft route cross-fade page transitions; (2) staggered scroll-reveal with
> blur-in; (3) hero headline shimmer on load + scroll; bottles drift on scroll;
> (4) shop product cards: 3D tilt on hover (laptop) / press-scale (mobile),
> Ken-Burns image zoom, FLIP fade-shuffle on filter change, skeleton shimmer;
> (5) product gallery: slide/fade between images, pinch-to-zoom mobile,
> active-thumbnail glow; (6) variant pills: springy pop + price count-up;
> (7) "Add to Bag" fly-to-cart micro-animation + bouncing cart badge + sticky
> add-to-cart bar on mobile; (8) magnetic/glowing CTAs with tap ripple;
> (9) thin scroll-progress gradient line under the navbar.
>
> Constraints: animate only transform/opacity (60fps); NO horizontal overflow
> (use minmax(0,1fr) in grids); honor prefers-reduced-motion with graceful
> fallbacks; don't put transform/filter on #app (breaks the fixed navbar);
> keep it lightweight (no 3D libraries). Put helpers in src/immersive.js and
> styles in src/styles/immersive.css. After each change, `npm run build`,
> verify zero console errors and no overflow at 375px and 1440px, and tell me
> what you changed. Then deploy to Netlify.
