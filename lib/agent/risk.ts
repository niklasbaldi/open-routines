export type RiskLevel = "read" | "write-low" | "write-high" | "destructive";

export function classifyRisk(toolName: string): RiskLevel {
  const name = toolName.toLowerCase();

  if (name.includes("delete") || name.includes("remove")) return "destructive";

  if (
    name.includes("send") ||
    name.includes("reply") ||
    name.includes("forward") ||
    name.includes("create_event") ||
    name.includes("update_event") ||
    name.includes("insert") ||
    name.includes("post_message")
  )
    return "write-high";

  if (
    name.includes("label") ||
    name.includes("mark") ||
    name.includes("star") ||
    name.includes("draft") ||
    name.includes("archive")
  )
    return "write-low";

  return "read";
}
