import Link from "next/link";
import { db } from "@/lib/db/client";
import { routines, runs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RunList } from "@/components/runs/run-list";
import { Pencil } from "lucide-react";
import { FireButton } from "./fire-button";

export const dynamic = "force-dynamic";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, id))
    .limit(1);

  if (!routine) notFound();

  const routineRuns = await db
    .select()
    .from(runs)
    .where(eq(runs.routineId, id))
    .orderBy(desc(runs.startedAt))
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">
          {routine.name}
        </h1>
        <div className="flex items-center gap-2">
          <FireButton routineId={routine.id} />
          <Link href={`/routines/${routine.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 mb-8">
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-neutral-500">Model:</span>{" "}
            <span className="text-neutral-900">
              {routine.modelProvider}/{routine.modelName}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Integrations:</span>{" "}
            <span className="text-neutral-900">
              {(routine.integrations as string[]).join(", ") || "None"}
            </span>
          </div>
          {routine.cronSchedule && (
            <div>
              <span className="text-neutral-500">Schedule:</span>{" "}
              <span className="text-neutral-900">{routine.cronSchedule}</span>
            </div>
          )}
          <div>
            <span className="text-neutral-500">Prompt:</span>
            <pre className="mt-1 text-xs text-neutral-700 bg-neutral-50 p-3 rounded-md whitespace-pre-wrap font-[family-name:var(--font-mono)]">
              {routine.prompt}
            </pre>
          </div>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-neutral-900 mb-3">
        Run History
      </h2>
      <RunList
        runs={routineRuns.map((r) => ({
          ...r,
          startedAt: r.startedAt?.toISOString() ?? null,
          completedAt: r.completedAt?.toISOString() ?? null,
        }))}
        routineId={routine.id}
      />
    </div>
  );
}
