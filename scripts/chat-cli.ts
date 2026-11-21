/**
 * Chat with the Baytikk agent in your terminal - no WhatsApp setup needed.
 * Needs ANTHROPIC_API_KEY and Shopify credentials in .env.
 *
 *   npm run chat                    # pretend to be a customer with no known number
 *   npm run chat -- 96170123456     # pretend to chat from this WhatsApp number
 */
import readline from "node:readline/promises";
import { reply } from "../src/agent.js";
import { isHumanHandling } from "../src/conversations.js";

const customerId = process.argv[2]?.replace(/\D/g, "") || "0000000000";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`Chatting as +${customerId}. Type "exit" to quit.\n`);
while (true) {
  const text = (await rl.question("You: ")).trim();
  if (!text) continue;
  if (text.toLowerCase() === "exit") break;
  if (isHumanHandling(customerId)) {
    console.log("(The bot handed this chat to a human and stays quiet now.)\n");
    continue;
  }
  const answer = await reply(
    {
      id: customerId,
      name: "Test customer",
      onHandoff: async (reason, summary) => console.log(`\n[HAND-OFF → owner] ${reason}\n${summary}\n`),
    },
    [{ type: "text", text }],
  );
  console.log(`\nBaytikk: ${answer}\n`);
}
rl.close();
process.exit(0);
