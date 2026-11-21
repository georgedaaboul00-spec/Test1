import express from "express";
import type Anthropic from "@anthropic-ai/sdk";
import { reply } from "./agent.js";
import { config } from "./config.js";
import { enqueue, isHumanHandling, setHumanHandling } from "./conversations.js";
import {
  downloadMedia,
  extractMessages,
  isValidSignature,
  markReadWithTyping,
  sendText,
  type IncomingMessage,
  type WebhookPayload,
} from "./whatsapp.js";

const app = express();

// Keep the raw body: the webhook signature is computed over the exact bytes Meta sent.
app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody: Buffer }).rawBody = buf;
    },
  }),
);

app.get("/", (_req, res) => {
  res.send("Baytikk WhatsApp agent is running.");
});

// Meta calls this once when you register the webhook URL.
app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === config.whatsapp.verifyToken) {
    res.status(200).send(String(req.query["hub.challenge"] ?? ""));
  } else {
    res.sendStatus(403);
  }
});

// WhatsApp delivers messages here. Acknowledge immediately, then process in the background
// (Meta retries if it doesn't get a 200 quickly).
const seen = new Set<string>();
app.post("/webhook", (req, res) => {
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
  if (!isValidSignature(rawBody, req.header("x-hub-signature-256"))) {
    res.sendStatus(401);
    return;
  }
  res.sendStatus(200);

  const payload = req.body as WebhookPayload;
  handleOwnerEchoes(payload);

  for (const { message, profileName } of extractMessages(payload)) {
    if (seen.has(message.id)) continue; // Meta can deliver the same message twice
    seen.add(message.id);
    if (seen.size > 5000) seen.delete(seen.values().next().value!);

    enqueue(message.from, () => handleMessage(message, profileName)).catch((err) =>
      console.error("Failed to handle message:", err),
    );
  }
});

/**
 * If you use the WhatsApp Business app on the same number (coexistence) and reply to a customer
 * yourself, Meta sends an "echo". The bot then steps aside in that chat automatically.
 */
function handleOwnerEchoes(payload: WebhookPayload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "smb_message_echoes") continue;
      const echoes = (change.value as { message_echoes?: { to?: string }[] } | undefined)?.message_echoes ?? [];
      for (const echo of echoes) {
        if (echo.to) setHumanHandling(echo.to, config.handoffPauseHours);
      }
    }
  }
}

const OWNER_HELP =
  "Owner commands:\n- *bot on 9617XXXXXXX* - let the bot answer that customer again\n- *bot off 9617XXXXXXX* - pause the bot for that customer";

/** Lets the owner pause/resume the bot for a customer by messaging the bot number. */
async function handleOwnerCommand(text: string): Promise<boolean> {
  const match = text.trim().match(/^bot\s+(on|off)\s+\+?([\d\s-]{7,20})$/i);
  if (!match) {
    if (/^bot\b/i.test(text.trim())) {
      await sendText(config.ownerWhatsApp!, OWNER_HELP);
      return true;
    }
    return false;
  }
  const customer = match[2].replace(/\D/g, "");
  const on = match[1].toLowerCase() === "on";
  setHumanHandling(customer, on ? null : config.handoffPauseHours);
  await sendText(config.ownerWhatsApp!, on ? `✅ Bot is answering +${customer} again.` : `⏸️ Bot paused for +${customer}.`);
  return true;
}

async function toClaudeContent(message: IncomingMessage): Promise<Anthropic.Beta.BetaContentBlockParam[] | null> {
  switch (message.type) {
    case "text":
      return [{ type: "text", text: message.text?.body ?? "" }];
    case "button":
      return [{ type: "text", text: message.button?.text ?? "" }];
    case "interactive": {
      const title = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title;
      return title ? [{ type: "text", text: title }] : null;
    }
    case "image": {
      const media = message.image ? await downloadMedia(message.image.id) : null;
      const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!media || !supported.includes(media.mimeType)) {
        return [{ type: "text", text: "[The customer sent an image that could not be loaded.]" }];
      }
      return [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: media.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: media.data,
          },
        },
        { type: "text", text: message.image?.caption || "[The customer sent this photo.]" },
      ];
    }
    case "location": {
      const loc = message.location!;
      return [
        {
          type: "text",
          text: `[The customer shared a location: ${loc.name ?? ""} ${loc.address ?? ""} (${loc.latitude}, ${loc.longitude})]`,
        },
      ];
    }
    default:
      return null; // audio, video, stickers, documents...
  }
}

async function handleMessage(message: IncomingMessage, profileName?: string) {
  const from = message.from;

  if (config.ownerWhatsApp && from === config.ownerWhatsApp && message.type === "text") {
    if (await handleOwnerCommand(message.text?.body ?? "")) return;
  }

  if (isHumanHandling(from)) return; // a team member has this chat

  const content = await toClaudeContent(message);
  if (!content) {
    await sendText(
      from,
      "Sorry, I can only read text messages and photos 🙏 Could you type your question? / عذراً، فيك تكتبلي سؤالك؟",
    );
    return;
  }

  await markReadWithTyping(message.id);

  const answer = await reply(
    {
      id: from,
      name: profileName,
      onHandoff: async (reason, summary) => {
        if (!config.ownerWhatsApp) return;
        await sendText(
          config.ownerWhatsApp,
          `🔔 *Hand-off: ${reason}*\nCustomer: ${profileName ?? "unknown"} (+${from})\nwa.me/${from}\n\n${summary}\n\nThe bot is paused for this chat for ${config.handoffPauseHours}h. Send "bot on ${from}" to resume it.`,
        );
      },
    },
    content,
  );

  await sendText(from, answer);
}

app.listen(config.port, () => {
  console.log(`Baytikk WhatsApp agent listening on port ${config.port} (model: ${config.claude.model})`);
});
