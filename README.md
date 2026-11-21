# Baytikk WhatsApp Agent

A WhatsApp customer-support bot for **[baytikk.com](https://baytikk.com)**. It answers customers on WhatsApp
in English, Arabic, Arabizi or French. It uses Claude for the conversation and reads live data from
the Baytikk Shopify store.

## What it does

| Customer asks… | Bot does… |
|---|---|
| "Do you have something for kitchen storage?" / "fi 3andkon night light?" | Reads the live catalog and recommends in-stock products with prices and links |
| "How much is the jewelry organizer bundle of 3?" | Pulls the product's options, prices, sale price and stock |
| "Where is my order BC6611?" | Looks up the order. It shares details only if the customer's WhatsApp number, or the email/phone they give, matches the order |
| "How long is delivery?" / "Can I return it?" | Answers from the policies in `src/store-info.ts` |
| Complaint, damaged item, refund, "I want to order via chat", "talk to a person" | Collects the details, **hands off**: alerts your WhatsApp and goes quiet in that chat |
| Sends a photo | Looks at it (e.g. "do you sell this?") |

**Hand-off flow:** the bot sends you an alert with a summary and a `wa.me` link, then pauses in that
chat for 12h. Send **`bot on 961XXXXXXXX`** to the bot number to resume it early, or `bot off …` to
pause it for a customer.
If you use the WhatsApp Business app on the same number ("coexistence"), the bot also steps aside
automatically whenever you reply to a customer yourself.

## How it works

```
Customer on WhatsApp ──► Meta WhatsApp Cloud API ──► this server (/webhook)
                                                      │
                                                      ├─► Claude (Messages API, tool use)
                                                      │     tools: browse_catalog, get_product,
                                                      │            lookup_order, handoff_to_human
                                                      └─► Shopify Admin API (products, orders)
```

| File | Purpose |
|---|---|
| `src/store-info.ts` | **Edit this** to change policies, FAQ answers, tone. No code needed. |
| `src/agent.ts` | Claude conversation loop and tools |
| `src/shopify.ts` | Catalog, product details, verified order lookup |
| `src/whatsapp.ts` | Sending messages, typing indicator, images, webhook signature check |
| `src/server.ts` | Webhook endpoint, owner commands, hand-off alerts |
| `src/conversations.ts` | Per-customer chat history (in memory, resets after 24h of silence) |

## Costs (rough estimates)

| Item | Cost |
|---|---|
| **WhatsApp Cloud API** | Replies to customers who message you first are **free** (24h customer-service window). You only pay for marketing/utility *templates*, which this bot doesn't send. |
| **Hosting** | ~$5–7/month (Render, Railway, Fly.io). Use an always-on plan; free tiers sleep and miss messages. |
| **Claude, Opus 5.5 (default)** | Roughly **$0.01–0.04 per customer message**, so ~$0.05–0.15 per conversation. 1,000 conversations a month comes to about **$50–150**. |
| **Claude, Haiku 5.5** (`AGENT_MODEL=claude-haiku-5-5`) | About 40x cheaper: roughly **$2–5 for 1,000 conversations**. Lower quality on tricky or mixed-language chats, so test it with real questions before switching. |

Prompt caching is on, so the system prompt, tools and chat history are billed at about 10% of the
normal input price after the first message. Check real spend in the Anthropic Console after a few days.

## Setup

### 1. Run it locally in your terminal (no WhatsApp yet)

```bash
npm install
cp .env.example .env      # fill in ANTHROPIC_API_KEY + Shopify credentials
npm run chat              # chat as a customer
npm run chat -- 96170123456   # chat "from" a specific number (tests order verification)
```

### 2. Shopify access

1. Shopify admin → **Settings → Apps → Develop apps** (or the **Dev Dashboard**) → create an app named "WhatsApp bot".
2. Give it the Admin API scopes **`read_products`** and **`read_orders`**, then install it on the store.
3. Put either the Admin API access token in `SHOPIFY_ADMIN_TOKEN`, or the client ID and secret in
   `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET`.

### 3. WhatsApp Cloud API

1. Go to [developers.facebook.com](https://developers.facebook.com), create an app of type **Business**, and add **WhatsApp**.
2. Add your business phone number. To keep using the WhatsApp Business app on your phone with the
   same number, choose the **"connect existing WhatsApp Business app"** (coexistence) option.
3. Create a **System User** in Business Settings, generate a permanent token with
   `whatsapp_business_messaging` and `whatsapp_business_management`, and set it as `WHATSAPP_ACCESS_TOKEN`.
4. Copy the **Phone number ID** into `WHATSAPP_PHONE_NUMBER_ID`, and copy the **App secret** into `WHATSAPP_APP_SECRET`.

### 4. Deploy and connect the webhook

1. Deploy to Render, Railway or similar, with build command `npm install && npm run build` and start command `npm start`.
   Add all `.env` values as environment variables.
2. In the Meta app → WhatsApp → **Configuration → Webhook**:
   - Callback URL: `https://YOUR-APP-URL/webhook`
   - Verify token: the same value as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to **`messages`** (and **`smb_message_echoes`** if you use coexistence).
3. Message your business number from another phone. The bot should answer. 🎉

> **Hand-off alerts:** WhatsApp lets the bot message *you* freely only if you messaged the bot number
> in the last 24 hours. Send it any message (e.g. `bot`) to open the window. For alerts that always
> arrive, create a WhatsApp utility template, or check chats in the WhatsApp Business app.

## Limits and next steps

- Chat history is kept in memory. It resets on redeploy and only works with a single server
  instance. Swap `src/conversations.ts` for Redis/Postgres if you need more.
- Voice notes aren't transcribed yet. The bot asks the customer to type instead.
- The bot never places orders itself. It collects the details and hands off to you.
