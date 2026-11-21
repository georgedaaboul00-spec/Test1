import type Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";

export interface Conversation {
  /** Full Claude message history, appended to and never edited (keeps caching and thinking valid). */
  messages: Anthropic.Beta.BetaMessageParam[];
  lastActivity: number;
  /** While set and in the future, the bot stays silent so a human can take over. */
  humanUntil?: number;
}

/**
 * In-memory conversation store. Conversations reset after CONVERSATION_TTL_HOURS of silence,
 * and are lost on restart - fine for a support bot. Swap in Redis/Postgres here if you need
 * history to survive deploys or run more than one server instance.
 */
const conversations = new Map<string, Conversation>();

/** Rough cap so one very long chat can't grow the prompt (and cost) without bound. */
const MAX_MESSAGES = 120;

export function getConversation(customerId: string): Conversation {
  const ttl = config.conversationTtlHours * 3_600_000;
  const now = Date.now();
  let convo = conversations.get(customerId);
  const expired = convo && now - convo.lastActivity > ttl;
  const tooLong = convo && convo.messages.length > MAX_MESSAGES;
  if (!convo || expired || tooLong) {
    // Keep an active hand-off pause even when history resets.
    const humanUntil = convo?.humanUntil && convo.humanUntil > now ? convo.humanUntil : undefined;
    convo = { messages: [], lastActivity: now, humanUntil };
    conversations.set(customerId, convo);
  }
  return convo;
}

export function isHumanHandling(customerId: string): boolean {
  const convo = conversations.get(customerId);
  return !!convo?.humanUntil && convo.humanUntil > Date.now();
}

export function setHumanHandling(customerId: string, hours: number | null): void {
  const convo = getConversation(customerId);
  convo.humanUntil = hours ? Date.now() + hours * 3_600_000 : undefined;
}

// Periodically drop stale conversations to free memory.
setInterval(() => {
  const cutoff = Date.now() - config.conversationTtlHours * 3_600_000;
  for (const [id, convo] of conversations) {
    if (convo.lastActivity < cutoff && !(convo.humanUntil && convo.humanUntil > Date.now())) {
      conversations.delete(id);
    }
  }
}, 3_600_000).unref();

/**
 * Runs tasks for the same customer one at a time, in order, so two quick messages
 * don't produce overlapping replies or corrupt the history.
 */
const queues = new Map<string, Promise<void>>();
export function enqueue(customerId: string, task: () => Promise<void>): Promise<void> {
  const previous = queues.get(customerId) ?? Promise.resolve();
  const next = previous.then(task, task).finally(() => {
    if (queues.get(customerId) === next) queues.delete(customerId);
  });
  queues.set(customerId, next);
  return next;
}
