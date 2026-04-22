import { Worker, Job } from "bullmq";
import { connection } from "./connection";
import { executeRoutine } from "@/lib/agent/executor";
import { sendCompletionNotification } from "@/lib/agent/notify";
import { db } from "@/lib/db/client";
import { runs, routines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

      try {
        const result = await executeRoutine({
          routineId: routine.id,
          runId,
          prompt: routine.prompt,
          modelProvider: routine.modelProvider,
          modelName: routine.modelName,
          integrations: routine.integrations as string[],
          maxSteps: routine.maxSteps,
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
