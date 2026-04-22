"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RunPoller({ runId }: { runId: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/v1/runs/${runId}`);
      const run = await res.json();
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

  return (
    <div className="mb-4 flex items-center gap-2 text-xs text-neutral-500">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
      </span>
      Live — refreshing every 3s
    </div>
  );
}
