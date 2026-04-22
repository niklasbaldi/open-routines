/**
 * check-tools.ts
 *
 * Lists available Composio toolkits and their actions.
 * Run: npm run check-tools
 *
 * Use this to find the correct toolkit names for Google Calendar and Gmail
 * before running the spike.
 */

import "dotenv/config";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

async function main() {
  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  });

  console.log("--- Composio Connection Check ---\n");

  // Create a session and list available tools
  const session = await composio.create("dominic", {
    toolkits: ["gmail", "googlecalendar"],
  });

  const tools = await session.tools();

  console.log(`Found ${Object.keys(tools).length} tools:\n`);

  for (const [name, tool] of Object.entries(tools)) {
    const desc =
      typeof tool === "object" && tool !== null && "description" in tool
        ? (tool as { description?: string }).description ?? ""
        : "";
    console.log(`  ${name}`);
    if (desc) console.log(`    ${desc.slice(0, 100)}`);
  }

  console.log("\n--- Done ---");
}

main().catch((err) => {
  console.error("Error:", err.message);
  console.error(
    "\nTroubleshooting:",
    "\n  1. Check COMPOSIO_API_KEY in .env",
    '\n  2. Toolkit names might differ — try "GMAIL" or "GOOGLE_CALENDAR"',
    "\n  3. You may need to connect Google account first: composio add gmail"
  );
  process.exit(1);
});
