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
