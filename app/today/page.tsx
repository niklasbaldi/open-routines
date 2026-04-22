import Link from "next/link";
import { db } from "@/lib/db/client";
import { routines, runs } from "@/lib/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { RunStatusBadge } from "@/components/runs/run-status-badge";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todaysRuns = await db
    .select({
      run: runs,
      routineName: routines.name,
      routineId: routines.id,
    })
    .from(runs)
    .innerJoin(routines, eq(runs.routineId, routines.id))
    .where(gte(runs.startedAt, startOfDay))
    .orderBy(desc(runs.startedAt));

  const upcomingRoutines = await db
    .select()
    .from(routines)
    .where(
      and(eq(routines.isPaused, false))
    );

  const scheduledCount = upcomingRoutines.filter((r) => r.cronSchedule).length;
  const totalCostToday = todaysRuns.reduce(
    (sum, { run }) => sum + (run.costEstimate ?? 0),
    0
  );

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-2">Today</h1>
      <p className="text-xs text-neutral-400 mb-6">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <div className="flex gap-6 mb-6 text-sm">
        <div>
          <span className="text-neutral-400">Runs today:</span>{" "}
          <span className="font-medium text-neutral-900">
            {todaysRuns.length}
          </span>
        </div>
        <div>
          <span className="text-neutral-400">Cost:</span>{" "}
          <span className="font-medium text-neutral-900">
            ${totalCostToday.toFixed(4)}
          </span>
        </div>
        <div>
          <span className="text-neutral-400">Scheduled:</span>{" "}
          <span className="font-medium text-neutral-900">
            {scheduledCount} routine{scheduledCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {todaysRuns.length === 0 ? (
        <div className="text-center py-12 text-sm text-neutral-500">
          <p>No runs today yet.</p>
          <p className="mt-1">
            Your scheduled routines will appear here when they run.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaysRuns.map(({ run, routineName, routineId }) => (
            <Card key={run.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RunStatusBadge status={run.status} />
                  <Link
                    href={`/routines/${routineId}`}
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    {routineName}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  {run.startedAt && (
                    <span>
                      {run.startedAt.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {run.costEstimate != null && (
                    <span>${run.costEstimate.toFixed(4)}</span>
                  )}
                  <Link
                    href={`/routines/${routineId}/runs/${run.id}`}
                    className="text-neutral-500 hover:text-neutral-900 underline"
                  >
                    View
                  </Link>
                </div>
              </div>
              {run.outputText && (
                <div className="text-sm text-neutral-700 whitespace-pre-wrap line-clamp-6">
                  {run.outputText.slice(0, 600)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
