"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RunPoller({ runId }: { runId: string }) {
  const router = useRouter();
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [status, setStatus] = useState("running");

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/v1/runs/${runId}`);
      const run = await res.json();

      if (run.stepsJson && Array.isArray(run.stepsJson)) {
        setStepsCompleted(run.stepsJson.length);
      }
      setStatus(run.status);

      router.refresh();

      if (
        run.status === "completed" ||
        run.status === "failed" ||
        run.status === "cancelled"
      ) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [runId, router]);

  const label =
    status === "queued"
      ? "Queued — waiting for worker..."
      : status === "awaiting_confirmation"
        ? "Paused — action needs your approval"
        : stepsCompleted > 0
          ? `Running — ${stepsCompleted} step${stepsCompleted !== 1 ? "s" : ""} completed`
          : "Running...";

  return (
    <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
      </span>
      {label}
    </div>
  );
}
