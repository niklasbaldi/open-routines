"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function DuplicateButton({ routineId }: { routineId: string }) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);

    const res = await fetch(`/api/v1/routines/${routineId}`);
    const routine = await res.json();

    const newRes = await fetch("/api/v1/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${routine.name} (copy)`,
        prompt: routine.prompt,
        modelProvider: routine.modelProvider,
        modelName: routine.modelName,
        integrations: routine.integrations,
        cronSchedule: null,
        maxSteps: routine.maxSteps,
        timeoutSeconds: routine.timeoutSeconds,
        notifyOnComplete: routine.notifyOnComplete,
      }),
    });

    const newRoutine = await newRes.json();
    setDuplicating(false);
    router.push(`/routines/${newRoutine.id}`);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDuplicate}
      disabled={duplicating}
    >
      <Copy className="h-4 w-4 mr-1.5" />
      {duplicating ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
