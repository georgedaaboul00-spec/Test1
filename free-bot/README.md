# Baytikk FREE WhatsApp Price Bot ($0/month)

A no-AI WhatsApp bot. When a customer messages you from an ad, or asks about a product, it
replies **instantly** with the price, options, stock and delivery fee, using live data from Shopify.

```
Customer taps your Click-to-WhatsApp ad → "Hello! Can I get more info on this?"

Bot (instantly):
  *Egg Rolling Storage*
  Price: *$10* ~$20~
  🚚 Delivery: *$3* all over Lebanon, FREE on orders of $40+ (1-3 business days)

  🛒 Order here: https://baytikk.com/products/egg-rolling-storage
  Or send us your name, phone, address and quantity and we'll confirm your order ✅
```

## What it understands

| Customer sends | Bot replies |
|---|---|
| A message from a **Click-to-WhatsApp ad** | Price of the product in that ad. It reads the ad's headline, text or link. |
| "adesh l jewelry organizer?", "kam el egg cracker", "بكم crocs bag" | That product's price and options, plus delivery |
| A baytikk.com product link | That product's price and delivery |
| "price of the hooks" (several products match) | A short list of the matching products to choose from |
| "price?" / "سعر" with no product named | Asks which product, or for a photo (at most once every 6h per customer) |
| Arabic text | Replies in Arabic. English, Arabizi and French get English. |
| "hi", thanks, complaints, long questions | **Nothing.** You answer those yourself in the WhatsApp Business app. |

## Cost: $0

| Item | Cost |
|---|---|
| WhatsApp Cloud API | Free. Replies to customers who message you first are free. |
| Cloudflare Workers | Free plan: 100,000 messages/day, always on, no credit card. |
| Shopify custom app | Free |
| AI | None used |

## Setup (about 30 minutes)

### 1. Shopify token
Shopify admin → **Settings → Apps → Develop apps** → create an app → Admin API scope
**`read_products`** → install → copy the **Admin API access token** (`shpat_...`).

### 2. WhatsApp Cloud API
1. Go to [developers.facebook.com](https://developers.facebook.com), create an app of type **Business**, and add **WhatsApp**.
2. Connect your business number. Choose **"connect existing WhatsApp Business app"** (coexistence)
   so you keep chatting from the WhatsApp Business app on your phone. The bot only adds the
   automatic price replies.
3. Business Settings → **System users** → create one → generate a permanent token with
   `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Note the **Phone number ID** and the **App secret** (App settings → Basic).

### 3. Deploy to Cloudflare (free)
```bash
cd free-bot
npm install
npx wrangler login                      # opens the browser; create a free Cloudflare account
npx wrangler secret put SHOPIFY_ADMIN_TOKEN
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put WHATSAPP_VERIFY_TOKEN     # make up any password, e.g. baytikk-2026
npx wrangler secret put WHATSAPP_APP_SECRET
npm run deploy                           # prints your URL: https://baytikk-price-bot.<you>.workers.dev
```

### 4. Connect the webhook
Meta app → WhatsApp → **Configuration → Webhook**:
- Callback URL: `https://baytikk-price-bot.<you>.workers.dev/webhook`
- Verify token: the same password you used for `WHATSAPP_VERIFY_TOKEN`
- Subscribe to **`messages`**

Message your number from another phone with "kam el egg cracker". You should get the price back. 🎉

## Settings (`wrangler.toml`)

| Setting | Default | Meaning |
|---|---|---|
| `DELIVERY_FEE` | `3` | Delivery fee in USD (matches your Shopify shipping rates) |
| `FREE_DELIVERY_FROM` | `40` | Orders from this amount get free delivery |
| `AD_PRODUCT_MAP` | `{}` | For ads whose text doesn't name the product: `{"<ad id>": "<product handle>"}`. The ad ID is in Ads Manager; the handle is the end of the product URL. |
| `UNMATCHED_REPLY` | built-in | Custom text for "price?" with no product. Set to `""` to turn it off. |

Run `npm run deploy` again after changing settings.

**Tip for ads:** put the product name in the ad headline, or use the product link as the ad's
website URL. The bot then always knows which product the customer saw.

## Want smarter replies?
The AI bot in the repository root also answers free-form questions, checks order status and
hands off complaints. It costs roughly $2–5 per 1,000 conversations on Claude Haiku 5.5.
