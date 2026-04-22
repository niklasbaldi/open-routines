import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { runs } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [latest] = await db
    .select({
      outputText: runs.outputText,
      completedAt: runs.completedAt,
      costEstimate: runs.costEstimate,
      triggeredBy: runs.triggeredBy,
    })
    .from(runs)
    .where(and(eq(runs.routineId, id), eq(runs.status, "completed")))
    .orderBy(desc(runs.completedAt))
    .limit(1);

  if (!latest || !latest.outputText) {
    return NextResponse.json({ available: false }, { status: 404 });
  }

  return NextResponse.json({
    outputText: latest.outputText,
    completedAt: latest.completedAt,
    costEstimate: latest.costEstimate,
    triggeredBy: latest.triggeredBy,
  });
}
