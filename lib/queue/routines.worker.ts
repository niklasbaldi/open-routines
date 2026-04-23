import { Worker, Job } from "bullmq";
import { existsSync, mkdirSync, appendFileSync, readFileSync } from "fs";
import { join } from "path";
import { connection } from "./connection";
import { executeRoutine } from "@/lib/agent/executor";
import { sendCompletionNotification } from "@/lib/agent/notify";
import { db } from "@/lib/db/client";
import { runs, routines } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const VAULT_API_URL = process.env.QUEST_VAULT_API_URL;
const VAULT_API_KEY = process.env.QUEST_VAULT_API_KEY;
const VAULT_ROOT = process.env.QUEST_VAULT_PATH ?? join(process.env.HOME ?? "", "Quest-Vault");
const useHttp = Boolean(VAULT_API_URL && VAULT_API_KEY);

async function appendVaultMemory(routineName: string, output: string) {
  const slug = routineName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `Routines/${slug}/memory.md`;
  const date = new Date().toISOString().slice(0, 16).replace("T", " ");
  const entry = `\n## ${date}\n\n${output.slice(0, 2000)}\n`;

  if (useHttp) {
    // Check if the file exists by trying to read it
    const readRes = await fetch(
      `${VAULT_API_URL}?action=read&path=${encodeURIComponent(path)}`,
      { headers: { Authorization: `Bearer ${VAULT_API_KEY}` } }
    );
    const isNew = !readRes.ok;
    const header = `---\ntags: [routine, memory]\nsource: open-routines\n---\n# ${routineName} — Run Memory\n\nAuto-updated after each run.\n`;
    const content = isNew ? header + entry : entry;

    await fetch(VAULT_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAULT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        content,
        mode: isNew ? undefined : "append",
        summary: `${routineName} run memory`,
        tags: ["routine", "memory", "open-routines"],
      }),
    });
    return;
  }

  // Filesystem fallback (local dev)
  const dir = join(VAULT_ROOT, "Routines", slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, "memory.md");

  if (!existsSync(file)) {
    const header = `---\ntags: [routine, memory]\nsource: open-routines\n---\n# ${routineName} — Run Memory\n\nAuto-updated after each run.\n`;
    appendFileSync(file, header + entry, "utf-8");
  } else {
    appendFileSync(file, entry, "utf-8");
  }
}

export function startRoutinesWorker() {
  const worker = new Worker(
    "routines",
    async (job: Job) => {
      const { routineId, runId: existingRunId, triggeredBy } = job.data;

      const [routine] = await db
        .select()
        .from(routines)
        .where(eq(routines.id, routineId))
        .limit(1);

      if (!routine) throw new Error(`Routine ${routineId} not found`);

      // For cron jobs, create the run row
      let runId = existingRunId;
      if (!runId) {
        const [newRun] = await db
          .insert(runs)
          .values({
            routineId,
            status: "queued",
            triggeredBy: triggeredBy ?? "cron",
          })
          .returning();
        runId = newRun.id;
      }

      await db
        .update(runs)
        .set({ status: "running", startedAt: new Date() })
        .where(eq(runs.id, runId));

      // Fetch previous run output for diff context
      const [previousRun] = await db
        .select({ outputText: runs.outputText })
        .from(runs)
        .where(eq(runs.routineId, routineId))
        .orderBy(desc(runs.completedAt))
        .limit(1);

      try {
        const result = await executeRoutine({
          routineId: routine.id,
          runId,
          prompt: routine.prompt,
          modelProvider: routine.modelProvider,
          modelName: routine.modelName,
          integrations: routine.integrations as string[],
          maxSteps: routine.maxSteps,
          enableVault: routine.enableVault,
          enableQuestTasks: routine.enableQuestTasks,
          memory: routine.memoryJson as Record<string, unknown> | null,
          previousOutputText: previousRun?.outputText,
        });

        await db
          .update(runs)
          .set({
            status: "completed",
            completedAt: new Date(),
            stepsJson: result.steps,
            outputText: result.outputText,
            tokenUsage: result.tokenUsage,
            costEstimate: result.costEstimate,
          })
          .where(eq(runs.id, runId));

        // Update DB memory (operational metadata)
        await db
          .update(routines)
          .set({
            memoryJson: {
              lastRunAt: new Date().toISOString(),
              lastOutputPreview: result.outputText.slice(0, 1000),
              totalRuns: ((routine.memoryJson as Record<string, unknown>)?.totalRuns as number ?? 0) + 1,
            },
          })
          .where(eq(routines.id, routineId));

        // Write to Quest-Vault memory (browsable in Obsidian)
        if (routine.enableVault) {
          try {
            await appendVaultMemory(routine.name, result.outputText);
          } catch (err) {
            console.error("[Worker] Vault memory write failed:", (err as Error).message);
          }
        }

        if (routine.notifyOnComplete) {
          await sendCompletionNotification(
            routine.notifyOnComplete,
            routine.name,
            "completed",
            result.outputText.slice(0, 500)
          ).catch((err) =>
            console.error("[Worker] Notification failed:", err.message)
          );
        }
      } catch (error) {
        await db
          .update(runs)
          .set({
            status: "failed",
            completedAt: new Date(),
            error: error instanceof Error ? error.message : String(error),
          })
          .where(eq(runs.id, runId));

        if (routine.notifyOnComplete) {
          await sendCompletionNotification(
            routine.notifyOnComplete,
            routine.name,
            "failed",
            error instanceof Error ? error.message : String(error)
          ).catch(() => {});
        }
        throw error;
      }
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[Worker] Routines worker started");
  return worker;
}
