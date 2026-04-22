import Link from "next/link";
import { db } from "@/lib/db/client";
import { routines } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutinesList } from "./routines-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allRoutines = await db
    .select()
    .from(routines)
    .orderBy(desc(routines.createdAt));

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
        <div className="text-center py-16 text-sm text-neutral-500">
          <p>No routines yet.</p>
          <p className="mt-1">Create one to get started.</p>
        </div>
      ) : (
        <RoutinesList routines={allRoutines} />
      )}
    </div>
  );
}
