import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

export async function sendCompletionNotification(
  notifyConfig: string,
  routineName: string,
  status: "completed" | "failed",
  summary: string
) {
  // Format: "slack:#channel" or "gmail:email@example.com"
  const [integration, target] = notifyConfig.split(":");
  if (!integration || !target) return;

  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  });

  const session = await composio.create("dominic", {
    toolkits: [integration],
  });
  const tools = await session.tools();

  const icon = status === "completed" ? "✅" : "❌";
  const message = `${icon} Routine "${routineName}" ${status}\n\n${summary}`;

  // Find and execute the appropriate send action
  const toolNames = Object.keys(tools);

  if (integration === "gmail") {
    const sendTool = toolNames.find(
      (n) => n.toLowerCase().includes("send") && n.toLowerCase().includes("email")
    );
    if (sendTool) {
      const tool = tools[sendTool] as { execute?: (args: unknown) => Promise<unknown> };
      if (tool.execute) {
        await tool.execute({
          recipient_email: target,
          subject: `${icon} ${routineName} — ${status}`,
          body: message,
        });
      }
    }
  }

  // For other integrations, log for now
  console.log(`[Notify] ${integration}:${target} — ${routineName} ${status}`);
}
