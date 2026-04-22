"use client";

import { useRouter } from "next/navigation";
import { RoutineCard } from "@/components/routines/routine-card";

interface Routine {
  id: string;
  name: string;
  cronSchedule: string | null;
  isPaused: boolean;
  modelName: string;
  integrations: unknown;
  lastRunStatus?: string | null;
  lastRunAt?: string | null;
}

export function RoutinesList({ routines }: { routines: Routine[] }) {
  const router = useRouter();

  async function handleTogglePause(id: string, paused: boolean) {
    await fetch(`/api/v1/routines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaused: paused }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {routines.map((r) => (
        <RoutineCard
          key={r.id}
          id={r.id}
          name={r.name}
          cronSchedule={r.cronSchedule}
          isPaused={r.isPaused}
          modelName={r.modelName}
          integrations={r.integrations as string[]}
          onTogglePause={handleTogglePause}
          lastRunStatus={r.lastRunStatus}
          lastRunAt={r.lastRunAt}
        />
      ))}
    </div>
  );
}
