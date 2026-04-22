import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db/client";
import { routines } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { syncCronJobs } from "@/lib/queue/routines.queue";

export async function GET() {
  const all = await db
    .select()
    .from(routines)
    .orderBy(desc(routines.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [routine] = await db
    .insert(routines)
    .values({
      name: body.name,
      prompt: body.prompt,
      modelProvider: body.modelProvider ?? "anthropic",
      modelName: body.modelName ?? "claude-sonnet-4-6",
      integrations: body.integrations ?? [],
      cronSchedule: body.cronSchedule ?? null,
      maxSteps: body.maxSteps ?? 25,
      timeoutSeconds: body.timeoutSeconds ?? 300,
      notifyOnComplete: body.notifyOnComplete ?? null,
      webhookId: randomBytes(12).toString("base64url"),
    })
    .returning();

  if (routine.cronSchedule) {
    await syncCronJobs();
  }

  return NextResponse.json(routine, { status: 201 });
}
