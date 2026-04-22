import Link from "next/link";
import { RunStatusBadge } from "./run-status-badge";

interface Run {
  id: string;
  routineId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  costEstimate: number | null;
  triggeredBy: string;
}

export function RunList({
  runs,
  routineId,
}: {
  runs: Run[];
  routineId: string;
}) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-8 text-center">
        No runs yet. Click &quot;Run Now&quot; to execute this routine.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {runs.map((run) => {
        const duration =
          run.startedAt && run.completedAt
            ? Math.round(
                (new Date(run.completedAt).getTime() -
                  new Date(run.startedAt).getTime()) /
                  1000
              )
            : null;

        return (
          <Link
            key={run.id}
            href={`/routines/${routineId}/runs/${run.id}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <RunStatusBadge status={run.status} />
              <span className="text-sm text-neutral-600">
                {run.startedAt
                  ? new Date(run.startedAt).toLocaleString()
                  : "Queued"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              {duration !== null && <span>{duration}s</span>}
              {run.costEstimate !== null && (
                <span>${run.costEstimate.toFixed(4)}</span>
              )}
              <span>{run.triggeredBy}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
