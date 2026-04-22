import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pendingConfirmations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(pendingConfirmations)
    .set({
      resolved: true,
      approved: body.approved ?? false,
      resolvedAt: new Date(),
    })
    .where(eq(pendingConfirmations.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
