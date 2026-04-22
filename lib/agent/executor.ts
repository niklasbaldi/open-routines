import { generateText, stepCountIs, type ToolSet } from "ai";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { getModel, estimateCost } from "./models";
import { classifyRisk } from "./risk";
import { vaultTools } from "./vault-tools";
import { db } from "@/lib/db/client";
import { runs, pendingConfirmations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface ExecuteRoutineInput {
  routineId: string;
  runId: string;
  prompt: string;
  modelProvider: string;
  modelName: string;
  integrations: string[];
  maxSteps: number;
  enableVault?: boolean;
  memory?: Record<string, unknown> | null;
  previousOutputText?: string | null;
}

export interface StepLog {
  stepNumber: number;
  timestamp: string;
  toolCalls?: Array<{
    toolName: string;
    input: unknown;
    riskLevel: string;
  }>;
  toolResults?: Array<{
    toolName: string;
    output: unknown;
    success: boolean;
  }>;
  text?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface ExecuteRoutineResult {
  outputText: string;
  steps: StepLog[];
  tokenUsage: { inputTokens: number; outputTokens: number };
  costEstimate: number;
}

function wrapToolsWithGuardrails(
  tools: ToolSet,
  runId: string
): ToolSet {
  const wrapped: Record<string, unknown> = {};

  for (const [name, tool] of Object.entries(tools)) {
    const risk = classifyRisk(name);
    const t = tool as { execute?: (...args: unknown[]) => Promise<unknown>; [key: string]: unknown };

    if (risk === "destructive") {
      wrapped[name] = {
        ...t,
        execute: async () => ({
          error: `Action "${name}" is blocked by guardrails (destructive action).`,
        }),
      };
    } else if (risk === "write-high" && t.execute) {
      const originalExecute = t.execute;
      wrapped[name] = {
        ...t,
        execute: async (...args: unknown[]) => {
          const [confirmation] = await db
            .insert(pendingConfirmations)
            .values({
              runId,
              toolName: name,
              toolArgs: args[0] as object,
              riskLevel: risk,
            })
            .returning();

          await db
            .update(runs)
            .set({ status: "awaiting_confirmation" })
            .where(eq(runs.id, runId));

          const result = await waitForConfirmation(confirmation.id);

          await db
            .update(runs)
            .set({ status: "running" })
            .where(eq(runs.id, runId));

          if (!result.approved) {
            return { error: "Action denied by user." };
          }

          return originalExecute(...args);
        },
      };
    } else {
      wrapped[name] = tool;
    }
  }

  return wrapped as ToolSet;
}

async function waitForConfirmation(
  confirmationId: string,
  timeoutMs = 300_000
): Promise<{ approved: boolean }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [row] = await db
      .select()
      .from(pendingConfirmations)
      .where(eq(pendingConfirmations.id, confirmationId))
      .limit(1);

    if (row?.resolved) {
      return { approved: row.approved ?? false };
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  await db
    .update(pendingConfirmations)
    .set({ resolved: true, approved: false, resolvedAt: new Date() })
    .where(eq(pendingConfirmations.id, confirmationId));

  return { approved: false };
}

export async function executeRoutine(
  input: ExecuteRoutineInput
): Promise<ExecuteRoutineResult> {
  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  });

  const session = await composio.create("dominic", {
    toolkits: input.integrations,
  });
  const rawTools = await session.tools();

  // Merge Composio tools + vault tools if enabled
  let allTools: ToolSet = { ...rawTools };
  if (input.enableVault) {
    allTools = { ...allTools, ...vaultTools } as ToolSet;
  }

  const tools = wrapToolsWithGuardrails(allTools, input.runId);
  const model = getModel(input.modelProvider, input.modelName);
  const steps: StepLog[] = [];

  // Build system prompt with memory and diff context
  let systemPrompt = input.prompt;

  if (input.enableVault) {
    systemPrompt += "\n\nYou have access to the Quest-Vault knowledge base via vault_read, vault_write, vault_list, and vault_search tools. Use these to read context and save insights. Your run output will also be automatically saved to Quest-Vault/Routines/<routine-name>/memory.md for long-term reference.";
  }

  if (input.memory && Object.keys(input.memory).length > 0) {
    systemPrompt += `\n\n## Memory from previous runs\n${JSON.stringify(input.memory, null, 2)}\n\nUse this context to provide incremental updates rather than repeating information. Highlight what's new or changed.`;
  }

  if (input.previousOutputText) {
    systemPrompt += `\n\n## Previous run output (for reference)\n${input.previousOutputText.slice(0, 3000)}\n\nFocus on what has CHANGED since this previous output. Don't repeat unchanged information — highlight new items, resolved items, and differences.`;
  }

  systemPrompt += "\n\nBefore executing any tools, briefly state your plan (2-3 bullet points of what you'll do). Then proceed.";

  const result = await generateText({
    model,
    tools,
    system: systemPrompt,
    prompt: "Execute this routine now.",
    stopWhen: stepCountIs(input.maxSteps),
    onStepFinish({ stepNumber, toolCalls, toolResults, text, usage }) {
      const step: StepLog = {
        stepNumber,
        timestamp: new Date().toISOString(),
      };

      if (toolCalls?.length) {
        step.toolCalls = toolCalls.map((tc) => ({
          toolName: tc.toolName,
          input: tc.input,
          riskLevel: classifyRisk(tc.toolName),
        }));
      }

      if (toolResults?.length) {
        step.toolResults = toolResults.map((tr) => ({
          toolName: tr.toolName,
          output:
            "output" in tr
              ? JSON.stringify(tr.output).slice(0, 2000)
              : undefined,
          success: "success" in tr ? (tr.success as boolean) : true,
        }));
      }

      if (text) step.text = text;

      if (usage) {
        step.usage = {
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
        };
      }

      steps.push(step);

      // Persist steps in real-time
      db.update(runs)
        .set({ stepsJson: steps })
        .where(eq(runs.id, input.runId))
        .then(() => {});
    },
  });

  const tokenUsage = {
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
  };

  return {
    outputText: result.text,
    steps,
    tokenUsage,
    costEstimate: estimateCost(input.modelName, tokenUsage),
  };
}
