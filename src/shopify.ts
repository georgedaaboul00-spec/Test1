import { config } from "./config.js";

// ---------------------------------------------------------------------------
// Admin API access token
// ---------------------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Returns an Admin API token. Uses SHOPIFY_ADMIN_TOKEN if set; otherwise exchanges the
 * Dev Dashboard app's client credentials for a short-lived token and refreshes it as needed.
 */
async function getAccessToken(): Promise<string> {
  const { adminToken, clientId, clientSecret, shopDomain } = config.shopify;
  if (adminToken) return adminToken;
  if (!clientId || !clientSecret) {
    throw new Error("Set SHOPIFY_ADMIN_TOKEN, or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.");
  }
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60_000) return cachedToken.value;

  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`Shopify token request failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 86_400) * 1000,
  };
  return cachedToken.value;
}

async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const { shopDomain, apiVersion } = config.shopify;
  const res = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getAccessToken(),
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data?: T; errors?: unknown };
  if (body.errors) throw new Error(`Shopify GraphQL error: ${JSON.stringify(body.errors)}`);
  return body.data as T;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const PRODUCT_FIELDS = `
  title
  handle
  onlineStoreUrl
  description(truncateAt: 350)
  tracksInventory
  priceRangeV2 { minVariantPrice { amount } maxVariantPrice { amount } }
  compareAtPriceRange { maxVariantCompareAtPrice { amount } }
  variants(first: 10) { nodes { title price availableForSale } }
`;

interface ProductNode {
  title: string;
  handle: string;
  onlineStoreUrl: string | null;
  description: string;
  tracksInventory: boolean;
  priceRangeV2: { minVariantPrice: { amount: string }; maxVariantPrice: { amount: string } };
  compareAtPriceRange: { maxVariantCompareAtPrice: { amount: string } } | null;
  variants: { nodes: { title: string; price: string; availableForSale: boolean }[] };
}

function formatProduct(p: ProductNode) {
  const variants = p.variants.nodes;
  const min = Number(p.priceRangeV2.minVariantPrice.amount);
  const max = Number(p.priceRangeV2.maxVariantPrice.amount);
  const compareAt = Number(p.compareAtPriceRange?.maxVariantCompareAtPrice.amount ?? 0);
  return {
    title: p.title,
    url: p.onlineStoreUrl ?? `${config.shopify.storefrontUrl}/products/${p.handle}`,
    price_usd: min === max ? min : `${min} - ${max}`,
    was_price_usd: compareAt > max ? compareAt : undefined,
    in_stock: variants.some((v) => v.availableForSale),
    options:
      variants.length > 1 || variants[0]?.title !== "Default Title"
        ? variants.map((v) => ({
            option: v.title,
            price_usd: Number(v.price),
            in_stock: v.availableForSale,
          }))
        : undefined,
    description: p.description,
  };
}

interface CatalogNode {
  title: string;
  handle: string;
  onlineStoreUrl: string | null;
  productType: string;
  tags: string[];
  totalInventory: number;
  tracksInventory: boolean;
  priceRangeV2: { minVariantPrice: { amount: string } };
}

const CATALOG_TTL_MS = 5 * 60_000;
let catalogCache: { at: number; items: ReturnType<typeof formatCatalogItem>[] } | null = null;

function formatCatalogItem(p: CatalogNode) {
  return {
    handle: p.handle,
    title: p.title,
    from_usd: Number(p.priceRangeV2.minVariantPrice.amount),
    in_stock: !p.tracksInventory || p.totalInventory > 0,
    type: p.productType || undefined,
    tags: p.tags.length ? p.tags.slice(0, 6) : undefined,
  };
}

/**
 * A compact list of every published product (title, price, stock). Baytikk's catalog is small,
 * so handing Claude the whole list matches synonyms, Arabic and Arabizi far better than keyword
 * search. Cached for 5 minutes.
 */
export async function listCatalog() {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.items;
  const items: ReturnType<typeof formatCatalogItem>[] = [];
  let after: string | null = null;
  do {
    const data: {
      products: { nodes: CatalogNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
    } = await adminGraphql(
      `query ($after: String) {
         products(first: 100, after: $after, query: "status:active AND published_status:published", sortKey: TITLE) {
           nodes { title handle onlineStoreUrl productType tags totalInventory tracksInventory
                   priceRangeV2 { minVariantPrice { amount } } }
           pageInfo { hasNextPage endCursor }
         }
       }`,
      { after },
    );
    items.push(...data.products.nodes.map(formatCatalogItem));
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after && items.length < 500);
  catalogCache = { at: Date.now(), items };
  return items;
}

/** Full details (description, options, per-option price and stock, link) for one product. */
export async function getProduct(handle: string) {
  const data = await adminGraphql<{ productByIdentifier: (ProductNode & { status: string }) | null }>(
    `query ($handle: String!) {
       productByIdentifier(identifier: { handle: $handle }) { status ${PRODUCT_FIELDS} }
     }`,
    { handle: handle.trim().toLowerCase() },
  );
  const product = data.productByIdentifier;
  if (!product || product.status !== "ACTIVE") return null;
  return formatProduct(product);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

interface OrderNode {
  name: string;
  createdAt: string;
  cancelledAt: string | null;
  email: string | null;
  phone: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customer: {
    defaultEmailAddress: { emailAddress: string } | null;
    defaultPhoneNumber: { phoneNumber: string } | null;
  } | null;
  shippingAddress: { phone: string | null; city: string | null } | null;
  lineItems: { nodes: { title: string; quantity: number }[] };
  fulfillments: {
    displayStatus: string | null;
    estimatedDeliveryAt: string | null;
    trackingInfo: { company: string | null; number: string | null; url: string | null }[];
  }[];
}

/** Normalizes a phone number to its local Lebanese digits (drops +961 / 00961 / leading 0). */
function normalizePhone(raw: string | null | undefined): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("961")) digits = digits.slice(3);
  return digits.replace(/^0+/, "");
}

function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (x.length < 7 || y.length < 7) return false;
  return x === y || x.endsWith(y) || y.endsWith(x);
}

export type OrderLookupResult =
  | { found: false; reason: string }
  | { found: true; verified: false; reason: string }
  | { found: true; verified: true; order: Record<string, unknown> };

/**
 * Looks up an order by number and only returns details if the customer proves it is theirs:
 * the WhatsApp number they are chatting from, or the email/phone they give, must match the order.
 */
export async function lookupOrder(
  orderNumber: string,
  contact: string | undefined,
  whatsappNumber: string | undefined,
): Promise<OrderLookupResult> {
  const cleaned = orderNumber.replace(/[#\s]/g, "").toUpperCase();
  if (!/^[A-Z0-9-]{2,20}$/.test(cleaned)) return { found: false, reason: "Invalid order number format." };

  // Customers often drop the store's prefix (e.g. type 6611 instead of BC6611), so try both.
  const candidates = /^\d+$/.test(cleaned) ? [cleaned, `BC${cleaned}`] : [cleaned];
  let order: OrderNode | undefined;
  for (const name of candidates) {
    const data = await adminGraphql<{ orders: { nodes: OrderNode[] } }>(
      `query ($q: String!) {
         orders(first: 1, query: $q) {
           nodes {
             name createdAt cancelledAt email phone displayFulfillmentStatus displayFinancialStatus
             totalPriceSet { shopMoney { amount currencyCode } }
             customer { defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber } }
             shippingAddress { phone city }
             lineItems(first: 20) { nodes { title quantity } }
             fulfillments(first: 5) { displayStatus estimatedDeliveryAt trackingInfo(first: 3) { company number url } }
           }
         }
       }`,
      { q: `name:${name}` },
    );
    order = data.orders.nodes.find((o) => o.name.replace("#", "").toUpperCase() === name);
    if (order) break;
  }
  if (!order) return { found: false, reason: "No order with that number." };

  const emails = [order.email, order.customer?.defaultEmailAddress?.emailAddress]
    .filter(Boolean)
    .map((e) => e!.toLowerCase().trim());
  const phones = [order.phone, order.shippingAddress?.phone, order.customer?.defaultPhoneNumber?.phoneNumber];

  const provided = contact?.trim().toLowerCase();
  const verified =
    phones.some((p) => phonesMatch(p, whatsappNumber)) ||
    (!!provided && (emails.includes(provided) || phones.some((p) => phonesMatch(p, provided))));

  if (!verified) {
    return {
      found: true,
      verified: false,
      reason: provided
        ? "The email/phone given does not match this order. Do not share any order details."
        : "Ask the customer for the email or phone number used on the order.",
    };
  }

  return {
    found: true,
    verified: true,
    order: {
      order_number: order.name,
      placed_at: order.createdAt,
      cancelled: !!order.cancelledAt,
      fulfillment_status: order.displayFulfillmentStatus,
      payment_status: order.displayFinancialStatus,
      total: `${order.totalPriceSet.shopMoney.amount} ${order.totalPriceSet.shopMoney.currencyCode}`,
      items: order.lineItems.nodes.map((li) => `${li.quantity} x ${li.title}`),
      delivery_city: order.shippingAddress?.city ?? undefined,
      shipments: order.fulfillments.map((f) => ({
        status: f.displayStatus,
        estimated_delivery: f.estimatedDeliveryAt,
        tracking: f.trackingInfo,
      })),
    },
  };
}
