import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/** Loaded lazily so the local CLI can run without WhatsApp settings. */
export const config = {
  port: Number(optional("PORT", "3000")),

  claude: {
    // Opus 5.5 by default. Set AGENT_MODEL=claude-haiku-5-5 for a much cheaper bot.
    model: optional("AGENT_MODEL", "claude-opus-5-5"),
    // Customer chat rarely needs deep reasoning; "low" keeps replies fast and cheap.
    effort: optional("AGENT_EFFORT", "low") as "low" | "medium" | "high" | "xhigh" | "max",
  },

  shopify: {
    get shopDomain() {
      return optional("SHOPIFY_SHOP_DOMAIN", "baytikklb.myshopify.com");
    },
    get storefrontUrl() {
      return optional("STOREFRONT_URL", "https://baytikk.com");
    },
    // Either a static Admin API access token...
    get adminToken() {
      return process.env.SHOPIFY_ADMIN_TOKEN;
    },
    // ...or a Dev Dashboard app's client credentials (token is fetched and refreshed automatically).
    get clientId() {
      return process.env.SHOPIFY_CLIENT_ID;
    },
    get clientSecret() {
      return process.env.SHOPIFY_CLIENT_SECRET;
    },
    apiVersion: optional("SHOPIFY_API_VERSION", "2026-10"),
  },

  whatsapp: {
    get accessToken() {
      return required("WHATSAPP_ACCESS_TOKEN");
    },
    get phoneNumberId() {
      return required("WHATSAPP_PHONE_NUMBER_ID");
    },
    get verifyToken() {
      return required("WHATSAPP_VERIFY_TOKEN");
    },
    get appSecret() {
      return process.env.WHATSAPP_APP_SECRET;
    },
    graphVersion: optional("WHATSAPP_GRAPH_VERSION", "v23.0"),
  },

  /** Owner's personal WhatsApp number (international format, digits only) for hand-off alerts. */
  ownerWhatsApp: process.env.OWNER_WHATSAPP,
  /** How long the bot stays quiet in a chat after handing it to a human. */
  handoffPauseHours: Number(optional("HANDOFF_PAUSE_HOURS", "12")),
  /** A chat with no messages for this long starts fresh. */
  conversationTtlHours: Number(optional("CONVERSATION_TTL_HOURS", "24")),
};
