// Baytikk FREE WhatsApp price bot. Paste this whole file into Cloudflare (Workers > your worker > Edit code). Generated from src/index.ts with: npm run build:paste

// src/index.ts
var SHOPIFY_API_VERSION = "2026-10";
var GRAPH_VERSION = "v23.0";
var catalog = null;
async function getCatalog(env) {
  if (catalog && Date.now() - catalog.at < 5 * 6e4) return catalog.products;
  const products = [];
  let after = null;
  do {
    const res = await fetch(`https://${env.SHOPIFY_SHOP_DOMAIN || "baytikklb.myshopify.com"}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
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
        variables: { after }
      })
    });
    if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
    const body = await res.json();
    if (body.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(body.errors)}`);
    const page = body.data.products;
    for (const p of page.nodes) {
      products.push({
        handle: p.handle,
        title: p.title,
        url: p.onlineStoreUrl ?? `${env.STOREFRONT_URL ?? "https://baytikk.com"}/products/${p.handle}`,
        tags: p.tags,
        compareAt: Number(p.compareAtPriceRange?.maxVariantCompareAtPrice?.amount ?? 0),
        variants: p.variants.nodes.map((v) => ({
          title: v.title,
          price: Number(v.price),
          available: v.availableForSale
        }))
      });
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after && products.length < 1e3);
  catalog = { at: Date.now(), products };
  return products;
}
var STOPWORDS = /* @__PURE__ */ new Set([
  "set",
  "of",
  "pack",
  "pcs",
  "pc",
  "the",
  "a",
  "an",
  "and",
  "with",
  "for",
  "in",
  "to",
  "x",
  "sides",
  "side",
  "piece",
  "pieces",
  "bundle"
]);
function words(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}
var stem = (w) => w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
function findProducts(text, products) {
  const link = text.match(/\/products\/([a-z0-9-]+)/i);
  if (link) {
    const byLink = products.find((p) => p.handle === link[1].toLowerCase());
    if (byLink) return [byLink];
  }
  const msg = new Set(words(text).map(stem));
  if (msg.size === 0) return [];
  const docs = products.map((p) => ({
    p,
    title: [...new Set(words(p.title).map(stem))],
    tags: new Set(p.tags.flatMap((t) => words(t).map(stem)))
  }));
  const df = /* @__PURE__ */ new Map();
  for (const d of docs) for (const w of /* @__PURE__ */ new Set([...d.title, ...d.tags])) df.set(w, (df.get(w) ?? 0) + 1);
  const weight = (w) => Math.log(1 + docs.length / (df.get(w) ?? 1));
  const scored = docs.map(({ p, title, tags }) => {
    const total = title.reduce((s, w) => s + weight(w), 0);
    const hit = title.filter((w) => msg.has(w)).reduce((s, w) => s + weight(w), 0);
    const tagHit = [...tags].filter((w) => msg.has(w) && !title.includes(w)).reduce((s, w) => s + weight(w), 0);
    const coverage = total ? hit / total : 0;
    return { p, score: hit + 0.5 * tagHit, coverage };
  }).filter((s) => s.coverage >= 0.25 || s.score >= 1.5).sort((a, b) => b.score - a.score || b.coverage - a.coverage);
  if (scored.length === 0) return [];
  const full = scored.filter((s) => s.coverage >= 0.99);
  if (full.length === 1) return [full[0].p];
  if (scored.length === 1 || scored[0].score >= 1.4 * scored[1].score) return [scored[0].p];
  return scored.slice(0, 3).map((s) => s.p);
}
var PRICE_WORDS = /\b(price|prices|how much|cost|kam|adesh|2adesh|adeh|2adeh|addesh|adde|2adde|bi kam|be kam|se3r|sa3er|si3r|prix|combien|info|details|available|interested)\b|سعر|السعر|بكم|بقديش|قديش|كم|حق|ثمن/i;
var isArabic = (text) => /[؀-ۿ]/.test(text);
function money(n) {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
function productReply(p, env, arabic) {
  const fee = Number(env.DELIVERY_FEE ?? "3");
  const freeFrom = Number(env.FREE_DELIVERY_FROM ?? "40");
  const time = env.DELIVERY_TIME ?? (arabic ? "\u0661 \u0625\u0644\u0649 \u0663 \u0623\u064A\u0627\u0645 \u0639\u0645\u0644" : "1-3 business days");
  const options = p.variants.filter((v) => v.title !== "Default Title");
  const inStock = p.variants.some((v) => v.available);
  const minPrice = Math.min(...p.variants.map((v) => v.price));
  const deliveryFree = minPrice >= freeFrom;
  const lines = [`*${p.title}*`];
  if (options.length) {
    for (const v of options) {
      const status = v.available ? "" : arabic ? " (\u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u062D\u0627\u0644\u064A\u0627\u064B)" : " (out of stock)";
      lines.push(`- ${v.title}: *${money(v.price)}*${status}`);
    }
  } else {
    const was = p.compareAt > minPrice ? ` ~${money(p.compareAt)}~` : "";
    lines.push(`${arabic ? "\u0627\u0644\u0633\u0639\u0631" : "Price"}: *${money(minPrice)}*${was}`);
  }
  if (!inStock) {
    lines.push(arabic ? "\u26A0\uFE0F \u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u062D\u0627\u0644\u064A\u0627\u064B." : "\u26A0\uFE0F Currently out of stock.");
  }
  if (arabic) {
    lines.push(
      deliveryFree ? `\u{1F69A} \u0627\u0644\u062A\u0648\u0635\u064A\u0644: *\u0645\u062C\u0627\u0646\u064A* \u0644\u0643\u0644 \u0644\u0628\u0646\u0627\u0646 (${time})` : `\u{1F69A} \u0627\u0644\u062A\u0648\u0635\u064A\u0644: *${money(fee)}* \u0644\u0643\u0644 \u0644\u0628\u0646\u0627\u0646\u060C \u0648\u0645\u062C\u0627\u0646\u064A \u0644\u0644\u0637\u0644\u0628\u0627\u062A \u0645\u0646 ${money(freeFrom)} \u0648\u0645\u0627 \u0641\u0648\u0642 (${time})`,
      "",
      `\u{1F6D2} \u0627\u0637\u0644\u0628 \u0645\u0646 \u0647\u0648\u0646: ${p.url}`,
      "\u0623\u0648 \u0627\u0628\u0639\u062A\u0644\u0646\u0627 \u0627\u0633\u0645\u0643\u060C \u0631\u0642\u0645\u0643\u060C \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0644\u0643\u0645\u064A\u0629 \u0644\u0646\u062B\u0628\u062A\u0644\u0643 \u0627\u0644\u0637\u0644\u0628 \u2705"
    );
  } else {
    lines.push(
      deliveryFree ? `\u{1F69A} Delivery: *FREE* all over Lebanon (${time})` : `\u{1F69A} Delivery: *${money(fee)}* all over Lebanon, FREE on orders of ${money(freeFrom)}+ (${time})`,
      "",
      `\u{1F6D2} Order here: ${p.url}`,
      "Or send us your name, phone, address and quantity and we'll confirm your order \u2705"
    );
  }
  return lines.join("\n");
}
function choiceReply(ps, arabic) {
  const head = arabic ? "\u0623\u064A \u0645\u0646\u062A\u062C \u0628\u062A\u0642\u0635\u062F\u061F \u{1F447}" : "Which product do you mean? \u{1F447}";
  const list = ps.map((p) => `- *${p.title}*: from ${money(Math.min(...p.variants.map((v) => v.price)))} ${p.url}`);
  const tail = arabic ? "\u0627\u0628\u0639\u062A\u0644\u0646\u0627 \u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0648\u0645\u0646\u0639\u0637\u064A\u0643 \u0643\u0644 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644." : "Reply with the product name and we'll send you all the details.";
  return [head, ...list, "", tail].join("\n");
}
async function sendText(env, to, body) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: true } })
  });
  if (!res.ok) console.error("WhatsApp send failed", res.status, await res.text());
}
async function validSignature(env, raw, header) {
  if (!env.WHATSAPP_APP_SECRET) return true;
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.WHATSAPP_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (given.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
var answered = /* @__PURE__ */ new Set();
var askedRecently = /* @__PURE__ */ new Map();
async function handleMessage(env, m) {
  if (answered.has(m.id)) return null;
  answered.add(m.id);
  if (answered.size > 5e3) answered.delete(answered.values().next().value);
  const text = m.text?.body ?? m.image?.caption ?? "";
  const ref = m.referral;
  const fromAd = ref?.source_type === "ad" || !!ref?.source_id;
  const arabic = isArabic(text);
  const products = await getCatalog(env);
  let matches = [];
  if (ref) {
    let map = {};
    try {
      map = env.AD_PRODUCT_MAP ? JSON.parse(env.AD_PRODUCT_MAP) : {};
    } catch {
      console.error("AD_PRODUCT_MAP is not valid JSON; ignoring it");
    }
    const mapped = ref.source_id ? products.find((p) => p.handle === map[ref.source_id]) : void 0;
    if (mapped) matches = [mapped];
    else matches = findProducts(`${ref.source_url ?? ""} ${ref.headline ?? ""} ${ref.body ?? ""}`, products);
  }
  if (matches.length === 0 && text) matches = findProducts(text, products);
  const asking = fromAd || /\/products\//i.test(text) || PRICE_WORDS.test(text) || text.trim().split(/\s+/).length <= 5;
  let reply = null;
  if (!asking) {
    reply = null;
  } else if (matches.length === 1) {
    reply = productReply(matches[0], env, arabic);
  } else if (matches.length > 1) {
    reply = choiceReply(matches, arabic);
  } else if ((fromAd || PRICE_WORDS.test(text)) && env.UNMATCHED_REPLY !== "") {
    const last = askedRecently.get(m.from) ?? 0;
    if (Date.now() - last > 6 * 36e5) {
      askedRecently.set(m.from, Date.now());
      reply = env.UNMATCHED_REPLY || (arabic ? "\u0623\u0647\u0644\u0627 \u0641\u064A\u0643 \u0628\u0640 Baytikk \u{1F44B} \u0627\u0628\u0639\u062A\u0644\u0646\u0627 \u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0623\u0648 \u0635\u0648\u0631\u062A\u0647 \u0648\u0645\u0646\u0631\u062F \u0639\u0644\u064A\u0643 \u0628\u0627\u0644\u0633\u0639\u0631 \u0641\u0648\u0631\u0627\u064B. \u{1F69A} \u062A\u0648\u0635\u064A\u0644 \u0644\u0643\u0644 \u0644\u0628\u0646\u0627\u0646." : "Welcome to Baytikk \u{1F44B} Send us the product name or a photo and we'll reply with the price right away. \u{1F69A} Delivery all over Lebanon.");
    }
  }
  if (reply) await sendText(env, m.from, reply);
  return reply;
}
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/webhook") return new Response("Baytikk price bot is running.");
    if (request.method === "GET") {
      const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === env.WHATSAPP_VERIFY_TOKEN;
      return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("Forbidden", { status: 403 });
    }
    if (request.method === "POST") {
      const raw = await request.text();
      if (!await validSignature(env, raw, request.headers.get("x-hub-signature-256"))) {
        return new Response("Bad signature", { status: 401 });
      }
      const payload = JSON.parse(raw);
      const messages = (payload.entry ?? []).flatMap(
        (e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? [])
      );
      ctx.waitUntil(
        Promise.all(messages.map((m) => handleMessage(env, m).catch((err) => console.error("handle failed", err))))
      );
      return new Response("OK");
    }
    return new Response("Method not allowed", { status: 405 });
  }
};
export {
  index_default as default,
  handleMessage
};
