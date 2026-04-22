"use client";

import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();

  async function useTemplate(index: number) {
    const t = TEMPLATES[index];
    const res = await fetch("/api/v1/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        prompt: t.prompt,
        modelProvider: t.modelProvider,
        modelName: t.modelName,
        integrations: t.integrations,
        cronSchedule: t.cronSchedule,
        maxSteps: t.maxSteps,
      }),
    });
    const routine = await res.json();
    router.push(`/routines/${routine.id}`);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-2">
        Templates
      </h1>
      <p className="text-sm text-neutral-500 mb-6">
        Pre-built routines you can use right away.
      </p>
      <div className="grid gap-3">
        {TEMPLATES.map((t, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-neutral-900">
                  {t.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                  {t.cronSchedule && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.cronSchedule}
                    </span>
                  )}
                  <span>{t.integrations.join(", ")}</span>
                  <span>{t.modelName}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => useTemplate(i)}
              >
                <Zap className="h-3 w-3 mr-1" />
                Use
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
