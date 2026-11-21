/**
 * Baytikk FREE WhatsApp price bot - no AI, runs on Cloudflare Workers' free plan.
 *
 * When a customer messages from a Click-to-WhatsApp ad (or names / links a product), it replies
 * instantly with the price, options, stock, delivery fee and delivery time - pulled live from Shopify.
 * Anything it can't match is left for you to answer in the WhatsApp Business app.
 */

export interface Env {
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_VERIFY_TOKEN: string;
  WHATSAPP_APP_SECRET?: string;
  SHOPIFY_SHOP_DOMAIN: string;
  SHOPIFY_ADMIN_TOKEN: string;
  STOREFRONT_URL?: string;
  /** Delivery fee in USD for orders below FREE_DELIVERY_FROM. */
  DELIVERY_FEE?: string;
  /** Order total (USD) from which delivery is free. */
  FREE_DELIVERY_FROM?: string;
  DELIVERY_TIME?: string;
  /** Optional JSON: {"<Meta ad id>": "<product handle>"} for ads whose text doesn't name the product. */
  AD_PRODUCT_MAP?: string;
  /** Optional: sent when someone asks for a price but no product could be matched. "" disables it. */
  UNMATCHED_REPLY?: string;
}

const SHOPIFY_API_VERSION = "2026-10";
const GRAPH_VERSION = "v23.0";

// ---------------------------------------------------------------------------
// Shopify catalog (cached per worker instance for 5 minutes)
// ---------------------------------------------------------------------------

interface Product {
  handle: string;
  title: string;
  url: string;
  tags: string[];
  compareAt: number;
  variants: { title: string; price: number; available: boolean }[];
}

let catalog: { at: number; products: Product[] } | null = null;

async function getCatalog(env: Env): Promise<Product[]> {
  if (catalog && Date.now() - catalog.at < 5 * 60_000) return catalog.products;
  const products: Product[] = [];
  let after: string | null = null;
  do {
    const res = await fetch(`https://${env.SHOPIFY_SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_TOKEN },
      body: JSON.stringify({
        query: `query ($after: String) {
          products(first: 100, after: $after, query: "status:active AND published_status:published") {
            nodes { handle title onlineStoreUrl tags
              compareAtPriceRange { maxVariantCompareAtPrice { amount } }
              variants(first: 20) { nodes { title price availableForSale } } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        variables: { after },
      }),
    });
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as any;
    if (body.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(body.errors)}`);
    const page = body.data.products;
    for (const p of page.nodes) {
      products.push({
        handle: p.handle,
        title: p.title,
        url: p.onlineStoreUrl ?? `${env.STOREFRONT_URL ?? "https://baytikk.com"}/products/${p.handle}`,
        tags: p.tags,
        compareAt: Number(p.compareAtPriceRange?.maxVariantCompareAtPrice?.amount ?? 0),
        variants: p.variants.nodes.map((v: any) => ({
          title: v.title,
          price: Number(v.price),
          available: v.availableForSale,
        })),
      });
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after && products.length < 1000);
  catalog = { at: Date.now(), products };
  return products;
}

// ---------------------------------------------------------------------------
// Matching a message (or the ad it came from) to a product
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "set", "of", "pack", "pcs", "pc", "the", "a", "an", "and", "with", "for", "in", "to", "x",
  "sides", "side", "piece", "pieces", "bundle",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/** Simple singular form so "hooks" matches "hook", "organizers" matches "organizer". */
const stem = (w: string) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

function findProducts(text: string, products: Product[]): Product[] {
  // 1. A product link anywhere in the text: baytikk.com/products/<handle>
  const link = text.match(/\/products\/([a-z0-9-]+)/i);
  if (link) {
    const byLink = products.find((p) => p.handle === link[1].toLowerCase());
    if (byLink) return [byLink];
  }

  // 2. Word overlap between the text and each product's title + tags. Rare words ("jewelry",
  //    "crocs") count much more than common ones ("organizer", "storage", "holder").
  const msg = new Set(words(text).map(stem));
  if (msg.size === 0) return [];
  const docs = products.map((p) => ({
    p,
    title: [...new Set(words(p.title).map(stem))],
    tags: new Set(p.tags.flatMap((t) => words(t).map(stem))),
  }));
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set([...d.title, ...d.tags])) df.set(w, (df.get(w) ?? 0) + 1);
  const weight = (w: string) => Math.log(1 + docs.length / (df.get(w) ?? 1));

  const scored = docs
    .map(({ p, title, tags }) => {
      const total = title.reduce((s, w) => s + weight(w), 0);
      const hit = title.filter((w) => msg.has(w)).reduce((s, w) => s + weight(w), 0);
      const tagHit = [...tags].filter((w) => msg.has(w) && !title.includes(w)).reduce((s, w) => s + weight(w), 0);
      const coverage = total ? hit / total : 0;
      return { p, score: hit + 0.5 * tagHit, coverage };
    })
    .filter((s) => s.coverage >= 0.25 || s.score >= 1.5)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage);

  if (scored.length === 0) return [];
  // The customer typed a product's full name -> that product.
  const full = scored.filter((s) => s.coverage >= 0.99);
  if (full.length === 1) return [full[0].p];
  // A clear winner -> one product; several close matches -> up to 3 to choose from.
  if (scored.length === 1 || scored[0].score >= 1.4 * scored[1].score) return [scored[0].p];
  return scored.slice(0, 3).map((s) => s.p);
}

const PRICE_WORDS =
  /\b(price|prices|how much|cost|kam|adesh|2adesh|adeh|2adeh|addesh|adde|2adde|bi kam|be kam|se3r|sa3er|si3r|prix|combien|info|details|available|interested)\b|سعر|السعر|بكم|بقديش|قديش|كم|حق|ثمن/i;

const isArabic = (text: string) => /[؀-ۿ]/.test(text);

// ---------------------------------------------------------------------------
// Reply text
// ---------------------------------------------------------------------------

function money(n: number) {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

function productReply(p: Product, env: Env, arabic: boolean): string {
  const fee = Number(env.DELIVERY_FEE ?? "3");
  const freeFrom = Number(env.FREE_DELIVERY_FROM ?? "40");
  const time = env.DELIVERY_TIME ?? (arabic ? "١ إلى ٣ أيام عمل" : "1-3 business days");
  const options = p.variants.filter((v) => v.title !== "Default Title");
  const inStock = p.variants.some((v) => v.available);
  const minPrice = Math.min(...p.variants.map((v) => v.price));
  const deliveryFree = minPrice >= freeFrom;

  const lines: string[] = [`*${p.title}*`];
  if (options.length) {
    for (const v of options) {
      const status = v.available ? "" : arabic ? " (غير متوفر حالياً)" : " (out of stock)";
      lines.push(`- ${v.title}: *${money(v.price)}*${status}`);
    }
  } else {
    const was = p.compareAt > minPrice ? ` ~${money(p.compareAt)}~` : "";
    lines.push(`${arabic ? "السعر" : "Price"}: *${money(minPrice)}*${was}`);
  }

  if (!inStock) {
    lines.push(arabic ? "⚠️ المنتج غير متوفر حالياً." : "⚠️ Currently out of stock.");
  }

  if (arabic) {
    lines.push(
      deliveryFree
        ? `🚚 التوصيل: *مجاني* لكل لبنان (${time})`
        : `🚚 التوصيل: *${money(fee)}* لكل لبنان، ومجاني للطلبات من ${money(freeFrom)} وما فوق (${time})`,
      "",
      `🛒 اطلب من هون: ${p.url}`,
      "أو ابعتلنا اسمك، رقمك، العنوان والكمية لنثبتلك الطلب ✅",
    );
  } else {
    lines.push(
      deliveryFree
        ? `🚚 Delivery: *FREE* all over Lebanon (${time})`
        : `🚚 Delivery: *${money(fee)}* all over Lebanon, FREE on orders of ${money(freeFrom)}+ (${time})`,
      "",
      `🛒 Order here: ${p.url}`,
      "Or send us your name, phone, address and quantity and we'll confirm your order ✅",
    );
  }
  return lines.join("\n");
}

function choiceReply(ps: Product[], arabic: boolean): string {
  const head = arabic ? "أي منتج بتقصد؟ 👇" : "Which product do you mean? 👇";
  const list = ps.map((p) => `- *${p.title}*: from ${money(Math.min(...p.variants.map((v) => v.price)))} ${p.url}`);
  const tail = arabic ? "ابعتلنا اسم المنتج ومنعطيك كل التفاصيل." : "Reply with the product name and we'll send you all the details.";
  return [head, ...list, "", tail].join("\n");
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

async function sendText(env: Env, to: string, body: string) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: true } }),
  });
  if (!res.ok) console.error("WhatsApp send failed", res.status, await res.text());
}

async function validSignature(env: Env, raw: string, header: string | null): Promise<boolean> {
  if (!env.WHATSAPP_APP_SECRET) return true;
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.WHATSAPP_APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (given.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

interface Referral {
  source_url?: string;
  source_id?: string;
  source_type?: string;
  headline?: string;
  body?: string;
}

interface Message {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  image?: { caption?: string };
  referral?: Referral;
}

/** Answered message IDs, so WhatsApp's occasional duplicate deliveries don't double-reply. */
const answered = new Set<string>();
/** Customers already sent the "which product?" reply, so they don't get it twice in a row. */
const askedRecently = new Map<string, number>();

export async function handleMessage(env: Env, m: Message): Promise<string | null> {
  if (answered.has(m.id)) return null;
  answered.add(m.id);
  if (answered.size > 5000) answered.delete(answered.values().next().value!);

  const text = m.text?.body ?? m.image?.caption ?? "";
  const ref = m.referral;
  const fromAd = ref?.source_type === "ad" || !!ref?.source_id;
  const arabic = isArabic(text);
  const products = await getCatalog(env);

  let matches: Product[] = [];

  // From a Click-to-WhatsApp ad: use the ad itself to know which product they saw.
  if (ref) {
    const map = env.AD_PRODUCT_MAP ? (JSON.parse(env.AD_PRODUCT_MAP) as Record<string, string>) : {};
    const mapped = ref.source_id ? products.find((p) => p.handle === map[ref.source_id!]) : undefined;
    if (mapped) matches = [mapped];
    else matches = findProducts(`${ref.source_url ?? ""} ${ref.headline ?? ""} ${ref.body ?? ""}`, products);
  }
  if (matches.length === 0 && text) matches = findProducts(text, products);

  // Only auto-reply when the customer is clearly asking about a product: came from an ad, sent a
  // product link, used a price word, or sent a short message like "egg cracker". A long message
  // that mentions a product ("the egg cracker I received is broken") is left for you.
  const asking =
    fromAd || /\/products\//i.test(text) || PRICE_WORDS.test(text) || text.trim().split(/\s+/).length <= 5;

  let reply: string | null = null;
  if (!asking) {
    reply = null;
  } else if (matches.length === 1) {
    reply = productReply(matches[0], env, arabic);
  } else if (matches.length > 1) {
    reply = choiceReply(matches, arabic);
  } else if ((fromAd || PRICE_WORDS.test(text)) && env.UNMATCHED_REPLY !== "") {
    const last = askedRecently.get(m.from) ?? 0;
    if (Date.now() - last > 6 * 3_600_000) {
      askedRecently.set(m.from, Date.now());
      reply =
        env.UNMATCHED_REPLY ||
        (arabic
          ? "أهلا فيك بـ Baytikk 👋 ابعتلنا اسم المنتج أو صورته ومنرد عليك بالسعر فوراً. 🚚 توصيل لكل لبنان."
          : "Welcome to Baytikk 👋 Send us the product name or a photo and we'll reply with the price right away. 🚚 Delivery all over Lebanon.");
    }
  }
  // Anything else (greetings, questions, complaints) is left for you to answer personally.

  if (reply) await sendText(env, m.from, reply);
  return reply;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/webhook") return new Response("Baytikk price bot is running.");

    if (request.method === "GET") {
      const ok =
        url.searchParams.get("hub.mode") === "subscribe" &&
        url.searchParams.get("hub.verify_token") === env.WHATSAPP_VERIFY_TOKEN;
      return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("Forbidden", { status: 403 });
    }

    if (request.method === "POST") {
      const raw = await request.text();
      if (!(await validSignature(env, raw, request.headers.get("x-hub-signature-256")))) {
        return new Response("Bad signature", { status: 401 });
      }
      const payload = JSON.parse(raw);
      const messages: Message[] = (payload.entry ?? []).flatMap((e: any) =>
        (e.changes ?? []).flatMap((c: any) => c.value?.messages ?? []),
      );
      // Reply in the background; WhatsApp only needs a fast 200.
      ctx.waitUntil(
        Promise.all(messages.map((m) => handleMessage(env, m).catch((err) => console.error("handle failed", err)))),
      );
      return new Response("OK");
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
