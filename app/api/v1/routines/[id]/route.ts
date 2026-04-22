import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { routines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncCronJobs } from "@/lib/queue/routines.queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, id))
    .limit(1);

  if (!routine) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(routine);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(routines)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(routines.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await syncCronJobs();
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(routines).where(eq(routines.id, id));
  await syncCronJobs();
  return new NextResponse(null, { status: 204 });
}
