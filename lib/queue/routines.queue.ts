import { Queue } from "bullmq";
import { connection } from "./connection";
import { db } from "@/lib/db/client";
import { routines } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export const routinesQueue = new Queue("routines", { connection });

export async function syncCronJobs() {
  // Remove all existing schedulers
  const existing = await routinesQueue.getJobSchedulers();
  for (const scheduler of existing) {
    await routinesQueue.removeJobScheduler(scheduler.id!);
  }

  // Add schedulers for active routines with cron
  const activeRoutines = await db
    .select()
    .from(routines)
    .where(and(eq(routines.isPaused, false), isNotNull(routines.cronSchedule)));

  for (const routine of activeRoutines) {
    if (routine.cronSchedule) {
      await routinesQueue.upsertJobScheduler(
        routine.id,
        { pattern: routine.cronSchedule },
        {
          name: "cron-fire",
          data: { routineId: routine.id, triggeredBy: "cron" },
        }
      );
    }
  }
}
