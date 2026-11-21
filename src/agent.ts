import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";
import { getConversation, setHumanHandling } from "./conversations.js";
import { getProduct, listCatalog, lookupOrder } from "./shopify.js";
import { SYSTEM_PROMPT } from "./store-info.js";

const client = new Anthropic();

/** Models that support server-side refusal fallbacks (Haiku does not). */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-2", "claude-fable-5-1", "claude-sonnet-5-5"]);

const MAX_TOOL_ROUNDS = 8;

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "browse_catalog",
    description:
      "List every product Baytikk currently sells: handle, title, starting price in USD, and " +
      "whether it is in stock. Use it to find products matching what the customer wants (match by " +
      "meaning, including Arabic or Arabizi requests), to answer 'what do you sell', and to find " +
      "alternatives. Then call get_product for details on the best matches.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "get_product",
    description:
      "Get full details for one product by its handle from browse_catalog: description, link, " +
      "price, sale/was price, available options (sizes, colors, bundles) with per-option price " +
      "and stock. Call this before quoting option prices or recommending a specific product.",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "Product handle from browse_catalog, e.g. 'egg-cracker'." },
      },
      required: ["handle"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "lookup_order",
    description:
      "Check the status of a customer's order. Needs the order number (e.g. BC6611 or 6611). " +
      "The customer's WhatsApp number is checked automatically; if it doesn't match the order, " +
      "the tool says so and you must ask for the email or phone number used on the order and " +
      "call again with it as `contact`. Never share details unless the tool returns verified: true.",
    input_schema: {
      type: "object",
      properties: {
        order_number: { type: "string" },
        contact: {
          type: "string",
          description: "Email or phone the customer says they used on the order. Empty string if not given yet.",
        },
      },
      required: ["order_number", "contact"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "handoff_to_human",
    description:
      "Pass this chat to the Baytikk team. Use for: requests for a person, complaints, damaged/" +
      "defective/wrong items, returns or refunds, orders placed through chat (after collecting the " +
      "order details), or anything you cannot answer. The bot then goes quiet in this chat so a " +
      "team member can reply.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Short category, e.g. 'damaged item', 'chat order'." },
        summary: {
          type: "string",
          description:
            "Everything the team needs in 1-5 lines: what the customer wants, order number, " +
            "products/quantities, name, address - whatever was collected.",
        },
      },
      required: ["reason", "summary"],
      additionalProperties: false,
    },
    strict: true,
  },
];

export interface CustomerContext {
  /** WhatsApp number (digits only); also the conversation key. */
  id: string;
  name?: string;
  /** Called when the bot hands off; used to alert the owner. */
  onHandoff?: (reason: string, summary: string) => Promise<void>;
}

async function runTool(name: string, input: Record<string, unknown>, customer: CustomerContext): Promise<string> {
  switch (name) {
    case "browse_catalog":
      return JSON.stringify(await listCatalog());
    case "get_product": {
      const product = await getProduct(String(input.handle ?? ""));
      return JSON.stringify(product ?? { error: "No active product with that handle. Check browse_catalog." });
    }
    case "lookup_order":
      return JSON.stringify(
        await lookupOrder(String(input.order_number ?? ""), String(input.contact ?? "") || undefined, customer.id),
      );
    case "handoff_to_human": {
      const reason = String(input.reason ?? "");
      const summary = String(input.summary ?? "");
      setHumanHandling(customer.id, config.handoffPauseHours);
      await customer.onHandoff?.(reason, summary).catch((err) => console.error("Hand-off alert failed:", err));
      return JSON.stringify({
        ok: true,
        note: "The team has been notified. Tell the customer a team member will reply in this chat soon.",
      });
    }
    default:
      return JSON.stringify({ error: `Unknown tool ${name}` });
  }
}

// ---------------------------------------------------------------------------
// Conversation turn
// ---------------------------------------------------------------------------

const FALLBACK_REPLY =
  "Sorry, I couldn't process that right now. Please try again in a moment, or call/WhatsApp us on 81465824 🙏";

/**
 * Adds the customer's message to their conversation, lets Claude answer (calling Shopify tools as
 * needed), and returns the text to send back on WhatsApp.
 */
export async function reply(
  customer: CustomerContext,
  content: Anthropic.Beta.BetaContentBlockParam[],
): Promise<string> {
  const convo = getConversation(customer.id);

  // On the first message, tell Claude who it's talking to (outside the cached system prompt).
  if (convo.messages.length === 0) {
    content = [
      {
        type: "text",
        text: `[Chat started on WhatsApp. Customer name: ${customer.name ?? "unknown"}. Customer number: +${customer.id}]`,
      },
      ...content,
    ];
  }
  convo.messages.push({ role: "user", content });
  convo.lastActivity = Date.now();

  const useFallbacks = FALLBACK_MODELS.has(config.claude.model);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await client.beta.messages.create({
        model: config.claude.model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: convo.messages,
        output_config: { effort: config.claude.effort },
        // Caches system prompt + tools + history, so each new message is billed mostly at cache rates.
        cache_control: { type: "ephemeral" },
        // If a safety classifier declines, retry on a suitable fallback model inside the same call.
        ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) console.error("Claude rate limited:", err.message);
      else if (err instanceof Anthropic.APIError) console.error(`Claude API error ${err.status}:`, err.message);
      else console.error("Claude request failed:", err);
      // Drop the unanswered user turn so the history stays valid (user/assistant alternation).
      if (round === 0) convo.messages.pop();
      return FALLBACK_REPLY;
    }

    // Always append the full content (including thinking blocks) unchanged.
    convo.messages.push({ role: "assistant", content: response.content });

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (response.stop_reason === "refusal") {
      console.warn("Claude declined:", response.stop_details);
      return "Sorry, I can't help with that here. For anything else about Baytikk, I'm happy to help!";
    }

    const toolUses = response.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
    );
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      return text || FALLBACK_REPLY;
    }

    // Run all requested tools in parallel and return every result in one user message.
    const results = await Promise.all(
      toolUses.map(async (tool): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
        try {
          const output = await runTool(tool.name, tool.input as Record<string, unknown>, customer);
          return { type: "tool_result", tool_use_id: tool.id, content: output };
        } catch (err) {
          console.error(`Tool ${tool.name} failed:`, err);
          return {
            type: "tool_result",
            tool_use_id: tool.id,
            is_error: true,
            content: "The store system is temporarily unavailable. Apologize and offer to hand off to the team.",
          };
        }
      }),
    );
    convo.messages.push({ role: "user", content: results });
  }

  return FALLBACK_REPLY;
}
