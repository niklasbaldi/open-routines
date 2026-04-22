import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { routines, runs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { routinesQueue } from "@/lib/queue/routines.queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;

  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.webhookId, webhookId))
    .limit(1);

  if (!routine) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 404 });
  }

  if (routine.isPaused) {
    return NextResponse.json({ error: "Routine is paused" }, { status: 409 });
  }

  // Capture the webhook payload as context
  let context = "";
  try {
    const body = await req.json();
    context = JSON.stringify(body);
  } catch {
    context = await req.text().catch(() => "");
  }

  const [run] = await db
    .insert(runs)
    .values({
      routineId: routine.id,
      status: "queued",
      triggeredBy: "webhook",
    })
    .returning();

  await routinesQueue.add("fire", {
    routineId: routine.id,
    runId: run.id,
    triggeredBy: "webhook",
    context,
  });

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
