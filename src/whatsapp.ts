import crypto from "node:crypto";
import { config } from "./config.js";

const graphUrl = (path: string) => `https://graph.facebook.com/${config.whatsapp.graphVersion}/${path}`;

async function graphPost(path: string, body: unknown): Promise<void> {
  const res = await fetch(graphUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
}

/** WhatsApp caps a text message at 4096 characters; split long replies on paragraph breaks. */
function splitMessage(text: string, limit = 4000): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n\n", limit);
    if (cut < limit / 2) cut = rest.lastIndexOf("\n", limit);
    if (cut < limit / 2) cut = rest.lastIndexOf(" ", limit);
    if (cut <= 0) cut = limit;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export async function sendText(to: string, text: string): Promise<void> {
  for (const body of splitMessage(text)) {
    await graphPost(`${config.whatsapp.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body, preview_url: true },
    });
  }
}

/** Marks the customer's message as read (blue ticks) and shows "typing..." while Claude works. */
export async function markReadWithTyping(messageId: string): Promise<void> {
  await graphPost(`${config.whatsapp.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
    typing_indicator: { type: "text" },
  }).catch((err) => console.warn("Could not mark message as read:", err.message));
}

/** Downloads an image the customer sent, returning base64 data for Claude's vision input. */
export async function downloadMedia(
  mediaId: string,
): Promise<{ data: string; mimeType: string } | null> {
  const headers = { Authorization: `Bearer ${config.whatsapp.accessToken}` };
  const metaRes = await fetch(graphUrl(mediaId), { headers });
  if (!metaRes.ok) return null;
  const meta = (await metaRes.json()) as { url: string; mime_type: string; file_size?: number };
  if (meta.file_size && meta.file_size > 5 * 1024 * 1024) return null; // Claude's per-image limit
  const fileRes = await fetch(meta.url, { headers });
  if (!fileRes.ok) return null;
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType: meta.mime_type.split(";")[0] };
}

/** Verifies Meta's X-Hub-Signature-256 header so only WhatsApp can call the webhook. */
export function isValidSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = config.whatsapp.appSecret;
  if (!secret) return true; // Not configured (local testing). Set WHATSAPP_APP_SECRET in production.
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = signatureHeader.slice("sha256=".length);
  return (
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"))
  );
}

// ---------------------------------------------------------------------------
// Incoming webhook payload (only the fields this bot uses)
// ---------------------------------------------------------------------------

export interface IncomingMessage {
  id: string;
  from: string; // customer's WhatsApp number, digits only, e.g. "96170123456"
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

export interface WebhookPayload {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        contacts?: { wa_id: string; profile?: { name?: string } }[];
        messages?: IncomingMessage[];
      };
    }[];
  }[];
}

export function extractMessages(payload: WebhookPayload) {
  const out: { message: IncomingMessage; profileName?: string }[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const message of value?.messages ?? []) {
        const contact = value?.contacts?.find((c) => c.wa_id === message.from);
        out.push({ message, profileName: contact?.profile?.name });
      }
    }
  }
  return out;
}
