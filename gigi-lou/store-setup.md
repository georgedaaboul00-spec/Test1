# GIGI LOU — Shopify Store Setup

Store: fzjwa8-sn.myshopify.com · Theme live: **Gigi Lou** · Domain: **homegigilou.com**

## ✅ Done
### Collections (auto-fill by product tag)
| Collection | Tag to add on a product |
|------------|-------------------------|
| New In | `new` |
| Living Room | `living` |
| Dining & Entertaining | `dining` |
| Bedroom & Bath | `bedroom` |
| Decor & Accents | `decor` |
| Candles & Scents | `scents` |
| Gifts | `gift` |

A product can have several tags, e.g. `new, living, gift`.

### Pages (all live)
- Our Story, Contact
- Shipping & Delivery, Returns & Exchanges, FAQ — default terms: Lebanon only, $3 flat, 2–4 business days, COD only, 7-day returns (unused, original packaging), damaged items within 48h. **Review and edit if your rules differ.**

### Homepage
Hero (bookshelf + "Ordinary was never the vision") → collections spotlight → featured Arco → New In → "Place it well" banner → Ivory/Noir comparison slider.

### Footer
Shop menu, Customer care menu, newsletter "Join the Gigi Lou list", logo. Placeholder social links removed.

### Menus
- **Main:** Home · New In · Shop ▾ (Living Room, Dining & Entertaining, Bedroom & Bath, Decor & Accents, Candles & Scents, Shop All) · Gifts · Our Story · Contact
- **Footer:** Our Story · Contact · Search (add the 3 draft pages once published)

## ⬜ To do (in Shopify admin)
1. ✅ Currency is USD. Time zone: Beirut (GMT+2).
2. **Cash on delivery only** — Settings → Payments: add manual method "Cash on Delivery (COD)", deactivate all other providers.
3. **Policies** — Settings → Policies: Refund + Shipping (copy text from the Returns / Shipping pages), and generate Privacy + Terms templates. (No API access.)
4. **Logo in admin-only places** — Settings → Brand (logo, square logo, cover), Checkout → Customize (logo), Notifications → Customize email templates (logo). Files are already in Content → Files.
5. ✅ Homepage redesigned.
6. **Add products** with photos, prices and tags.
7. **Remove store password** when ready: Online Store → Preferences.

## Products
| Product | Colours | Cost | Price (3.5×) | Margin | Status |
|---------|---------|------|--------------|--------|--------|
| Arco Sculptural Tissue Box | Ivory, Noir | $6.34 | $50.00 | $43.66 (87%) | Live |

Supplier: Jinjiang Minglingtu Trading Co., Ltd. (Alibaba), $4.39–6.34, min. order 2. Cost excludes shipping/customs.
Photos: `assets/products/arch-tissue-box/`

### Motion (theme asset `gigi-lou-motion.css`)
- Hero: slow 2.8s zoom-out on the photo; headline, subtitle and button rise in one by one with a soft blur
- Two big scrolling bands: oxblood "ORDINARY WAS NEVER THE VISION ✦ HOME, ELEVATED ✦ PLACE IT WELL" under the hero; sand "SCULPTURAL · TIMELESS · IVORY · NOIR · GIGI LOU" (reverse) after "Place it well"
- Every section rises into view on scroll; banner images settle from a gentle zoom
- Buttons press in on tap; product and collection images drift closer on hover
- All motion is off for visitors with "reduce motion" turned on

### Batch 2 — 14 products (DRAFT, waiting for supplier cost → price = 3.5× cost)
| Product | Variants | Tags |
|---|---|---|
| Perle Floating Wine Holder | — | new, dining, decor, gift |
| Ruban Floating Wine Holder | — | new, dining, decor, gift |
| Arcade Five-Taper Candelabra | — | new, living, scents, decor, gift |
| Nuage Tissue Box | — | new, living, bedroom, decor |
| Reine Gilded Bust | — | new, living, decor, gift |
| Lapin Valet Tray | Gold, Silver | new, bedroom, decor, gift |
| Bruno Bulldog Tissue Holder | Gold, Silver | new, living, decor, gift |
| Ourson Tissue Box | — | new, living, bedroom, decor, gift |
| Pomme d'Or Apple Sculpture | Gold, Silver | new, decor, living, gift |
| Halo Vase Set of 3 | — | new, living, decor, gift |
| Étreinte Sculpture | Sand, Noir, Ivory | new, decor, bedroom, living, gift |
| Café Suspendu Sculpture | Mocha, Cream | new, dining, decor, gift |
| Oiseau Geometric Bird | Silver, Gold accent | new, decor, living, gift |
| Ananas Pineapple Sculpture | White, Gold, Noir | new, decor, living, dining, gift |

Each has: original photo(s) + oxblood arch brand card, brand-voice description, SEO, stock 50 (sell when out of stock).

### Batch 3 — 11 products (DRAFT, waiting for supplier cost)
| Product | Variants |
|---|---|
| Panthère Geometric Sculpture | Noir, White |
| Rêverie Cloud Sitter | Crystal Ball, Reading |
| Madame Tray Bust | — |
| Licorne Glacée Sculpture | Pink, Blue scoop |
| Minou Shelf Cat Hook | Noir, White |
| Silence Face Sculpture | Noir, Gold, White |
| Glacé Balloon Dog Sculpture | Orange |
| David Gilded Gaze Bust | Noir, White |
| Penseur Thinker Sculpture | Gold, Noir, White |
| Lecteur Reading Sculpture | White, Noir |
| Mosaïque Sculpture | Gold, White, Terracotta |

Skipped: pineapple + birds (duplicates of Ananas / Oiseau), gold wall swallows (50px photo — need bigger).
Note: drafts from batch 2 were switched to ACTIVE by something outside this session twice; reset to DRAFT. 4 "Example product" items ($100, created 01:04 with the Clarity theme) are ACTIVE.

### Launch pricing
All 26 Gigi Lou products set to **$50** (every variant), ACTIVE, published to Online Store. Arco changed from $22.19 to $50.
Homepage: New In grid shows 16 products; new "The art of gifting" carousel (Gifts collection, 12 products) after the Ivory/Noir slider.

### Announcement bar (custom section `gl-announcement-bar`, top of every page)
Oxblood bar, stone text, gold ✦, scrolls continuously (30s loop, pauses on hover, static for reduced motion):
BLACK FRIDAY DEALS ARE HERE ✦ DELIVERY ALL OVER LEBANON ✦ CASH ON DELIVERY
Edit messages in the theme editor → Header → Announcement marquee.

### Header
Solid ivory header (no longer transparent over the hero). Collections row under the logo (desktop centred; mobile swipeable bar):
New In · Living Room · Decor & Accents · Bedroom & Bath · Dining · Gifts · Shop All. Our Story / Contact moved to footer only.
- Update: collections now scroll slowly in a custom "Collections marquee" section (60s loop, pauses on hover, reads the Main menu). Desktop inline menu hidden (marquee is the nav); mobile ☰ drawer still has the collections. Speed: Customize → Header → Collections marquee → Loop duration (higher = slower).

### Homepage v2 — product variety
1. Hero slideshow (autoplay 5s, 5 slides): Arco shelf · David "The gilded gaze" · Silence "Say nothing" · Rêverie "Head in the clouds" · Panthère "On the prowl"
2. Oxblood marquee
3. Collections spotlight — images: Living Room=Panthère, Decor=Silence, Bedroom=Rêverie, Dining=Café Suspendu, Gifts=Étreinte (New In=David)
4. Featured product: Reine Gilded Bust
5. New In grid (16)
6. "Place it well" banner → Perle Floating Wine Holder
7. Sand marquee
8. Madame editorial "Hats off to Madame" (replaced the Arco Ivory/Noir slider)
9. "The art of gifting" carousel
- Update: hero slideshow reverted to the single full-screen "Ordinary was never the vision" hero (bookshelf photo, slow zoom + text rise). Oxblood marquee under the hero removed. Other homepage variety changes kept.
- Update: all homepage scrolling text bands removed (oxblood + sand). Only the header announcement bar and collections row still move.

### Studio photos (same sand background) — batch 1
Main photo replaced for 13 products: Licorne (Pink), Ourson, Reine, Glacé, Ruban, Café Suspendu (Mocha), Nuage, Perle (3 shots), Mosaïque (White), Lapin (Gold + Silver), Silence (Gold), Halo, Pomme d'Or (Gold). Colour photos linked to their variants. Old supplier photos + cards kept further down each gallery.
Collection images now: Decor=Silence gold, Dining=Café Suspendu, Gifts=Lapin gold, Bedroom=Nuage. Homepage: Reine feature + Place it well banner use studio photos.
Still need studio photos: Arco, Arcade, Bruno, Étreinte, Oiseau, Ananas, Panthère, Rêverie, Madame, Minou, David, Penseur, Lecteur (+ other colours of Licorne Blue, Café Cream, Mosaïque Gold/Terracotta, Silence Noir/White, Pomme Silver).

### Studio photos — batch 2
Main photo replaced + linked to variants: David (Noir, White), Bruno (Gold, Silver), Étreinte (Sand), Arco (Ivory, Noir + extra Ivory), Arcade, Ananas (Noir).
New products ($50, live, tags new/decor/living/gift): **Majesté Lucky Cat** (gold, crown + ingot), **Ascension Wall Climber** (gold wall figure).
Still need studio photos: Oiseau, Panthère, Rêverie, Madame, Minou, Penseur, Lecteur.

### Frosted glass + 3D (theme assets `gigi-lou-glass.css` + `gigi-lou-glass.js`)
- Soft sand/stone ambient light behind the page
- Frosted (blurred, see-through) header and collections row
- Product cards float as rounded glass panels with soft shadows; on desktop they lift and tilt in 3D following the mouse
- Glossy oxblood pill buttons with a light sheen sweeping across on hover; ivory glass "Shop now" button
- Glass pill badges, rounded images (16px), inputs, drawers and menus
- All motion off for reduced-motion visitors
- Update: header is now a floating rounded glass pill (logo bar) with collections as glass chips below (slow scroll, oxblood on hover/active), Baytikk-style.
- Update: mobile menu drawer refined: 1rem bold spaced uppercase links with hairline dividers, frosted glass panel with rounded right corners, rounded product images.

### Cinematic scroll hero (`gigi-lou-scroll.js`, snippet `gl-hero-badge`, hero.liquid renders badge on first section only)
- Scrolling down: banner image tilts back in 3D, zooms in and darkens like a camera push; headline/button float up and fade
- Rotating badge (Gi G Lou logo + "GIGI LOU ✦ HOME, ELEVATED ✦ ORDINARY WAS NEVER THE VISION ✦") bottom-right of the banner, turns as you scroll (reverses on scroll up), links to all products
- Header untouched. Off for reduced-motion visitors (badge stays, static).
- Update: badge text now spins non-stop (~1 turn/20s) and speeds up/reverses with scroll. Hero made bigger (min 88% screen height) and more cinematic: continuous slow 3D sway (follows mouse on desktop), slow 26s camera drift/zoom, film vignette, warm light sweep every ~9s, stronger 3D push on scroll.
- Update: badge now spins at a constant speed on its own (no scroll influence) and no longer moves with scroll.
- Update: hero 'camera orbit' — continuous video-like 3D motion: swings ±10° left/right, tilts ±5°, slowly pushes in/out and drifts (desktop: follows mouse). Light sweep every 7s. Badge spin unchanged.

### Animated spotlight (custom section `gl-spotlight`, replaced the featured Reine section)
Oxblood stage "In the spotlight / Statement pieces": product floats in a gold-edged arch, gold halo glows and spins behind, gold text ring spins around (GIGI LOU ✦ STATEMENT PIECES ✦ CROWNED IN GOLD ✦ HOME, ELEVATED ✦). Auto-rotates every 5s with crossfade + zoom: Reine → David → Silence → Lapin → Majesté (name, tagline, price, Shop now, dots). Pauses on hover. Editable in Customize (products, taglines, speed, colours).
- Update: collections spotlight names smaller (1.4–2.25rem) and auto-cycle every 3.5s (highlight + matching image), pauses on hover/tap. Hero badge kept below the sticky header.
- Update: New In is now a single-row carousel (16 products, ~2.3 cards visible on phone) that auto-advances every 3s and loops; Gifts carousel too. Pauses on touch/hover.

### ⚠️ SOLD OUT on live site (open issue)
Admin says every variant is available (stock 50, continue selling, location fulfils online). Market "GIGILOU Lebanon" (regions Lebanon + United States) has **no web presence** and 0 catalogs → likely cause of storefront showing SOLD OUT / Unavailable. Fix: Settings → Markets → GIGILOU Lebanon → make sure Online Store / domain homegigilou.com is assigned (or set it as primary market). Not changed yet — waiting for owner OK.
- Update: New In now uses exactly the same settings as The art of gifting (sand background, carousel, 60cqw cards, arrows).
- Update: spotlight switching rebuilt (logic moved to gigi-lou-scroll.js): autoplay 5s, ‹ › arrows on the arch, tappable dots, swipe left/right on phones.
- Update: big collection list replaced by custom 'Shop by room' section (gl-rooms): arch photo tiles (New In, Living Room, Decor, Bedroom & Bath, Dining, Gifts) with name + piece count, swipeable row on phone, all 6 in a row on desktop, rise-in + gentle float, lift on hover.
