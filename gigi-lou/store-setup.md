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
| Arco Sculptural Tissue Box | Ivory, Noir | $6.34 | $22.19 | $15.85 (71%) | Live |

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
