export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startRoutinesWorker } = await import(
      "@/lib/queue/routines.worker"
    );
    const { syncCronJobs } = await import("@/lib/queue/routines.queue");

    startRoutinesWorker();
    await syncCronJobs();
    console.log("[Instrumentation] Worker and cron jobs initialized");
  }
}
