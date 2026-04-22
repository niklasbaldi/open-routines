import Link from "next/link";
import { db } from "@/lib/db/client";
import { routines, runs } from "@/lib/db/schema";
import { eq, desc, sum, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RunList } from "@/components/runs/run-list";
import { Pencil } from "lucide-react";
import { FireButton } from "./fire-button";
import { DuplicateButton } from "./duplicate-button";
import { CollapsiblePrompt } from "./collapsible-prompt";
import { cronToHuman } from "@/lib/cron-display";
import { integrationLabel } from "@/lib/integrations";

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

  const [stats] = await db
    .select({
      totalCost: sum(runs.costEstimate),
      totalRuns: count(),
    })
    .from(runs)
    .where(eq(runs.routineId, id));

  const totalCost = Number(stats?.totalCost ?? 0);
  const totalRuns = Number(stats?.totalRuns ?? 0);

  const integrations = routine.integrations as string[];

  return (
    <div>
      <div className="text-xs text-neutral-400 mb-4">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Routines</Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-600">{routine.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">
          {routine.name}
        </h1>
        <div className="flex items-center gap-2">
          <FireButton routineId={routine.id} />
          <DuplicateButton routineId={routine.id} />
          <Link href={`/routines/${routine.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 mb-6">
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
              {integrations.length > 0
                ? integrations.map(integrationLabel).join(", ")
                : "None"}
            </span>
          </div>
          {routine.cronSchedule && (
            <div>
              <span className="text-neutral-500">Schedule:</span>{" "}
              <span className="text-neutral-900">{cronToHuman(routine.cronSchedule)}</span>
            </div>
          )}
          {routine.webhookId && (
            <div>
              <span className="text-neutral-500">Webhook URL:</span>{" "}
              <code className="text-xs text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded font-[family-name:var(--font-mono)]">
                /api/v1/webhooks/{routine.webhookId}
              </code>
            </div>
          )}
          {routine.notifyOnComplete && (
            <div>
              <span className="text-neutral-500">Notify:</span>{" "}
              <span className="text-neutral-900">
                {routine.notifyOnComplete}
              </span>
            </div>
          )}
          {totalRuns > 0 && (
            <div className="pt-2 border-t border-neutral-100 flex gap-6 text-sm">
              <div>
                <span className="text-neutral-400">Total runs:</span>{" "}
                <span className="font-medium text-neutral-900">{totalRuns}</span>
              </div>
              <div>
                <span className="text-neutral-400">Total cost:</span>{" "}
                <span className="font-medium text-neutral-900">
                  ${totalCost.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-neutral-400">Avg cost/run:</span>{" "}
                <span className="font-medium text-neutral-900">
                  ${(totalCost / totalRuns).toFixed(4)}
                </span>
              </div>
            </div>
          )}
          <CollapsiblePrompt prompt={routine.prompt} />
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
