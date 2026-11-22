# GIGI LOU — Handoff for a new session

Read this first, then `store-setup.md` for the full history.

## The business
- **Gigi Lou**: luxury sculptural home decor & lifestyle, Lebanon.
- Store: `fzjwa8-sn.myshopify.com` · Domain: **homegigilou.com** · Email: contact@gigilouhome.com
- Currency **USD** · Time zone **Beirut** · Market **GIGILOU Lebanon** (LB + US)
- Delivery: **$3 flat, all over Lebanon**, 2–4 business days · Payment: **cash on delivery only**
- Brand colours: Oxblood `#3B0510` · Wine `#5E181B` · Stone `#DDD8D4` · Sand `#E0D3C7` · Ivory `#FAF9F4` · Gold `#B8955A`
- Fonts: Montserrat (bold headings) + script accent words. Tone: quiet luxury, short lines.

## Pricing rule
- **Price = supplier cost × 4, rounded up to the next whole dollar.** Cost is saved on every variant.
- Stock = real ordered quantities; products **stop selling at 0** (inventory policy DENY).
- Still at $50 / 50 stock with **no cost**: Majesté Lucky Cat, Ascension Wall Climber.
- Guessed quantities (screenshot cut off): Silence Gold 5, Ananas White M 7, Bulle Large Dark Blue 5.

## Products (30)
Products were **renamed by the owner** (e.g. Arco → "Threshold · Tissue Box", Perle → "Showstopper · Pearl Wine Holder"). Handles still use the old names (`arco-sculptural-tissue-box`, etc.).
- Drafts: **Envol Gold Wall Swallows** (no photos).
- Bulle Balloon Dog: Silver + Gold are real photos; Rainbow / Light Blue / Dark Blue are recoloured from the gold photo.
- Product sizes are stored in metafield `custom.dimensions` and shown on product pages.
- Tags drive collections: `new`, `living`, `dining`, `bedroom`, `decor`, `scents`, `gift`, `favourite` (shows ⭐ Customer favourite badge).

## Fixes already done to make products buyable
1. homegigilou.com web presence attached to market GIGILOU Lebanon
2. Market catalog "GIGILOU Lebanon catalog" + publication (all products)
3. Market delivery option "Delivery across Lebanon" $3
→ Products show **Add to cart** (verified).

## ⚠️ Themes — check before editing
The live theme has been switched several times from a MacBook (Shopify CLI):
- Live (MAIN) as of Nov 22 01:46: **"Gigi Lou – New In basket"** (`188193439959`)
- "Copy of Gigi Lou" (`188191965399`) and "Gigi Lou" (`188166865111`) are unpublished.
- Agent can only publish themes it created; edits to other live themes wait for the owner to publish.
- **Ask the owner which theme is final and that nobody else is editing before changing theme code.**

Custom theme pieces (exist in "Gigi Lou" / copies): announcement marquee, collections marquee, glass header, cinematic hero + rotating badge (`gigi-lou-scroll.js`), glass styles (`gigi-lou-glass.css`), animated spotlight (`gl-spotlight`), Shop by room (`gl-rooms`), animated feature (`gl-feature`), product perks (`gl-product-perks`: badges, delivery dates, low stock, cut-off countdown, size).

## SEO status
- Done (store data, works on any theme): SEO titles/descriptions for all 30 products, 7 collections, 5 pages.
- Built but **not live** (on unpublished themes): homepage title "Gigi Lou | Luxury Home Decor & Sculptures in Lebanon" + meta description, structured data snippet `gl-seo-schema` (WebSite, Store, Breadcrumbs). Re-apply to the final live theme.
- Owner to do: hide "Home Decor example products" collection (agent is blocked), connect Google Search Console + submit `homegigilou.com/sitemap.xml`, set homepage title in Online Store → Preferences.
- Optional: update product image alt text to the new product names.

## Owner preferences learned
- Wants things done directly ("do it", "go"); likes rich, animated, luxe visuals; dislikes busy scrolling text bands on the homepage.
- Header: keep the floating glass header + collection chips as they are.
- Does **not** want "ready to gift" or "7-day returns" badges.
- Agent will not add fake "X people viewing" counters.

## Repo
- Branch: `claude/elegant-planck-61eq5o`
- Assets: `gigi-lou/assets/` (logo, campaign images, product photos)
- Full log: `gigi-lou/store-setup.md`
