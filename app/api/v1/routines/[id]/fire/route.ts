import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { runs, routines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { routinesQueue } from "@/lib/queue/routines.queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, id))
    .limit(1);

  if (!routine) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const triggeredBy = (body.triggeredBy as string) ?? "manual";

  const [run] = await db
    .insert(runs)
    .values({
      routineId: id,
      status: "queued",
      triggeredBy: triggeredBy as "manual" | "cron" | "api",
    })
    .returning();

  await routinesQueue.add("fire", {
    routineId: id,
    runId: run.id,
    triggeredBy,
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
