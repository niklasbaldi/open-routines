"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export function FireButton({ routineId }: { routineId: string }) {
  const router = useRouter();
  const [firing, setFiring] = useState(false);

  async function handleFire() {
    setFiring(true);
    const res = await fetch(`/api/v1/routines/${routineId}/fire`, {
      method: "POST",
    });
    const data = await res.json();
    setFiring(false);

    if (data.runId) {
      router.push(`/routines/${routineId}/runs/${data.runId}`);
    }
  }

  return (
    <Button size="sm" onClick={handleFire} disabled={firing}>
      <Play className="h-4 w-4 mr-1.5" />
      {firing ? "Starting..." : "Run Now"}
    </Button>
  );
}
