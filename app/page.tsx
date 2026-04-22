import Link from "next/link";
import { db } from "@/lib/db/client";
import { routines, runs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutinesList } from "./routines-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allRoutines = await db
    .select()
    .from(routines)
    .orderBy(desc(routines.createdAt));

  const latestRuns = await Promise.all(
    allRoutines.map(async (r) => {
      const [latest] = await db
        .select({ status: runs.status, startedAt: runs.startedAt })
        .from(runs)
        .where(eq(runs.routineId, r.id))
        .orderBy(desc(runs.startedAt))
        .limit(1);
      return { routineId: r.id, latest };
    })
  );

  const routinesWithRuns = allRoutines.map((r) => {
    const entry = latestRuns.find((lr) => lr.routineId === r.id);
    return {
      ...r,
      lastRunStatus: entry?.latest?.status ?? null,
      lastRunAt: entry?.latest?.startedAt?.toISOString() ?? null,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">Routines</h1>
        <Link href="/routines/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Routine
          </Button>
        </Link>
      </div>

      {allRoutines.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm font-medium text-neutral-700">No routines yet.</p>
          <p className="text-sm text-neutral-500 mt-1">
            Get started by picking a template or creating your own.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link href="/routines/templates">
              <Button variant="outline" size="sm">Browse Templates</Button>
            </Link>
            <Link href="/routines/new">
              <Button size="sm">New Routine</Button>
            </Link>
          </div>
        </div>
      ) : (
        <RoutinesList routines={routinesWithRuns} />
      )}
    </div>
  );
}
