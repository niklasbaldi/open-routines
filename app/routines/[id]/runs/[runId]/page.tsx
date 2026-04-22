import Link from "next/link";
import { db } from "@/lib/db/client";
import { runs, pendingConfirmations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { RunStatusBadge } from "@/components/runs/run-status-badge";
import { StepViewer } from "@/components/runs/step-viewer";
import { ConfirmationBanner } from "@/components/runs/confirmation-banner";
import { RunPoller } from "./run-poller";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;

  const [run] = await db
    .select()
    .from(runs)
    .where(eq(runs.id, runId))
    .limit(1);

  if (!run) notFound();

  const pending = await db
    .select()
    .from(pendingConfirmations)
    .where(
      and(
        eq(pendingConfirmations.runId, runId),
        eq(pendingConfirmations.resolved, false)
      )
    );

  const isActive = run.status === "running" || run.status === "queued" || run.status === "awaiting_confirmation";
  const duration =
    run.startedAt && run.completedAt
      ? Math.round(
          (run.completedAt.getTime() - run.startedAt.getTime()) / 1000
        )
      : null;

  const usage = run.tokenUsage as {
    inputTokens?: number;
    outputTokens?: number;
  } | null;

  return (
    <div>
      {isActive && <RunPoller runId={runId} />}

      <div className="text-xs text-neutral-400 mb-4">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Routines</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/routines/${id}`} className="hover:text-neutral-700 transition-colors">Routine</Link>
        <span className="mx-1.5">/</span>
        <span className="text-neutral-600">Run</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <RunStatusBadge status={run.status} />
        <h1 className="text-lg font-semibold text-neutral-900">Run Detail</h1>
      </div>

      {pending.map((c) => (
        <ConfirmationBanner
          key={c.id}
          confirmation={{
            id: c.id,
            toolName: c.toolName,
            toolArgs: c.toolArgs,
            riskLevel: c.riskLevel,
          }}
        />
      ))}

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
          {run.startedAt && (
            <div>
              <span className="text-neutral-400">Started:</span>{" "}
              {run.startedAt.toLocaleString()}
            </div>
          )}
          {duration !== null && (
            <div>
              <span className="text-neutral-400">Duration:</span> {duration}s
            </div>
          )}
          {run.costEstimate !== null && (
            <div>
              <span className="text-neutral-400">Cost:</span> $
              {run.costEstimate.toFixed(4)}
            </div>
          )}
          {usage && (
            <div>
              <span className="text-neutral-400">Tokens:</span>{" "}
              {((usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)).toLocaleString()}
            </div>
          )}
          <div>
            <span className="text-neutral-400">Triggered:</span>{" "}
            {run.triggeredBy}
          </div>
        </div>
      </Card>

      {run.outputText && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">
            Output
          </h2>
          <Card className="p-5">
            <div className="prose prose-sm prose-neutral max-w-none whitespace-pre-wrap text-sm">
              {run.outputText}
            </div>
          </Card>
        </div>
      )}

      {run.error && (
        <Card className="p-4 mb-8 border-red-200 bg-red-50">
          <h2 className="text-sm font-semibold text-red-900 mb-1">Error</h2>
          <pre className="text-xs text-red-700 whitespace-pre-wrap font-[family-name:var(--font-mono)]">
            {run.error}
          </pre>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">
          Steps
        </h2>
        <StepViewer steps={(run.stepsJson as unknown[]) as never} />
      </div>
    </div>
  );
}
