import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { secrets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/secrets/crypto";

export async function GET() {
  const all = await db.select({ keyName: secrets.keyName }).from(secrets);
  return NextResponse.json(
    all.map((s) => ({ keyName: s.keyName, hasValue: true }))
  );
}

export async function PUT(req: NextRequest) {
  const { keyName, value } = await req.json();
  if (!keyName || !value) {
    return NextResponse.json({ error: "keyName and value required" }, { status: 400 });
  }

  const encrypted = encrypt(value);

  const existing = await db
    .select()
    .from(secrets)
    .where(eq(secrets.keyName, keyName))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(secrets)
      .set({ encryptedValue: encrypted, updatedAt: new Date() })
      .where(eq(secrets.keyName, keyName));
  } else {
    await db.insert(secrets).values({ keyName, encryptedValue: encrypted });
  }

  return NextResponse.json({ ok: true });
}
