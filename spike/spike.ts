/**
 * Open Routines — Phase 0 Spike
 *
 * Proves the core loop: Vercel AI SDK + Composio (Google Calendar + Gmail)
 *
 * What this does:
 *   1. Connects to Composio with Google Calendar + Gmail toolkits
 *   2. Runs an autonomous agent loop via Vercel AI SDK generateText
 *   3. Agent reads calendar and email, produces a morning briefing
 *   4. Logs every step (tool calls + results) for observability
 *
 * Run: npm run spike
 */

import "dotenv/config";
import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

// --- Config ---

const ROUTINE_PROMPT = `You are a personal assistant creating a morning briefing.

Do the following:
1. Check my Google Calendar for today's events
2. Check my Gmail inbox for unread emails from the last 12 hours
3. Write a concise morning briefing with:
   - Today's schedule (meetings with time and attendees)
   - Important emails that need attention
   - Any conflicts or double-bookings
   - A suggested priority order for the day

Keep the briefing under 500 words. Be direct and actionable.

IMPORTANT: Only READ data. Do not send emails, create events, or modify anything.`;

const MAX_STEPS = 15;
const MODEL = "claude-sonnet-4-6";

// --- Guardrail: Action Risk Levels ---

type RiskLevel = "read" | "write-low" | "write-high" | "destructive";

function classifyRisk(toolName: string): RiskLevel {
  const name = toolName.toLowerCase();

  if (name.includes("delete") || name.includes("remove")) return "destructive";

  if (
    name.includes("send") ||
    name.includes("reply") ||
    name.includes("forward") ||
    name.includes("create_event") ||
    name.includes("update_event")
  )
    return "write-high";

  if (
    name.includes("label") ||
    name.includes("mark") ||
    name.includes("star") ||
    name.includes("draft")
  )
    return "write-low";

  return "read";
}

const RISK_LABELS: Record<RiskLevel, string> = {
  read: "READ",
  "write-low": "WRITE",
  "write-high": "WRITE-HIGH ⚠",
  destructive: "BLOCKED 🚫",
};

// --- Main ---

async function main() {
  console.log("=== Open Routines — Phase 0 Spike ===\n");

  // 1. Initialize Composio
  console.log("[1/4] Connecting to Composio...");
  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  });

  const session = await composio.create("dominic", {
    toolkits: ["gmail", "googlecalendar"],
  });
  const tools = await session.tools();

  const toolNames = Object.keys(tools);
  console.log(`  Connected. ${toolNames.length} tools available.`);
  console.log(`  Tools: ${toolNames.join(", ")}\n`);

  // 2. Classify tool risk levels
  console.log("[2/4] Classifying tool risk levels...");
  for (const name of toolNames) {
    const risk = classifyRisk(name);
    console.log(`  [${RISK_LABELS[risk]}] ${name}`);
  }
  console.log();

  // 3. Run agent loop
  console.log(
    `[3/4] Running agent (model: ${MODEL}, maxSteps: ${MAX_STEPS})...\n`
  );

  const startTime = Date.now();

  const result = await generateText({
    model: anthropic(MODEL),
    tools,
    system: ROUTINE_PROMPT,
    prompt: "Create my morning briefing for today.",
    stopWhen: stepCountIs(MAX_STEPS),
    onStepFinish({
      stepNumber,
      toolCalls,
      toolResults,
      text,
      finishReason,
      usage,
    }) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          const risk = classifyRisk(call.toolName);

          if (risk === "destructive") {
            console.log(
              `  [Step ${stepNumber}] [${elapsed}s] BLOCKED: ${call.toolName} (destructive)`
            );
            continue;
          }

          if (risk === "write-high") {
            console.log(
              `  [Step ${stepNumber}] [${elapsed}s] WARN: ${call.toolName} (would require confirmation in production)`
            );
          }

          const argsPreview = call.input
            ? JSON.stringify(call.input).slice(0, 120)
            : "";
          console.log(
            `  [Step ${stepNumber}] [${elapsed}s] Tool: ${call.toolName}${argsPreview ? ` | Args: ${argsPreview}` : ""}`
          );
        }
      }

      if (toolResults && toolResults.length > 0) {
        for (const res of toolResults) {
          const value = "output" in res ? res.output : res;
          const preview =
            typeof value === "string"
              ? value.slice(0, 150)
              : JSON.stringify(value).slice(0, 150);
          console.log(
            `  [Step ${stepNumber}] [${elapsed}s] Result: ${preview}...`
          );
        }
      }

      if (text) {
        console.log(
          `  [Step ${stepNumber}] [${elapsed}s] Agent produced text (${finishReason})`
        );
      }

      if (usage) {
        console.log(
          `  [Step ${stepNumber}] Tokens: ${usage.totalTokens ?? "?"}`
        );
      }
    },
  });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. Output
  console.log(`\n[4/4] Done in ${totalTime}s (${result.steps.length} steps)\n`);
  console.log("--- Morning Briefing ---\n");
  console.log(result.text);
  console.log("\n--- End ---");

  // Usage stats
  if (result.usage) {
    console.log("\nToken usage:", {
      input: result.usage.inputTokens,
      output: result.usage.outputTokens,
    });
  }
}

main().catch((err) => {
  console.error("\nSpike failed:", err.message);

  if (err.message?.includes("api_key") || err.message?.includes("API key")) {
    console.error("  -> Check ANTHROPIC_API_KEY in .env");
  }
  if (
    err.message?.includes("composio") ||
    err.message?.includes("Composio") ||
    err.message?.includes("toolkit")
  ) {
    console.error("  -> Check COMPOSIO_API_KEY in .env");
    console.error(
      "  -> Connect Google account: composio add gmail && composio add googlecalendar"
    );
    console.error(
      '  -> Toolkit names might differ — run "npm run check-tools" to verify'
    );
  }

  process.exit(1);
});
