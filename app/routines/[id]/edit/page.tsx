import { db } from "@/lib/db/client";
import { routines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RoutineForm } from "@/components/routines/routine-form";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, id))
    .limit(1);

  if (!routine) notFound();

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">
        Edit Routine
      </h1>
      <RoutineForm
        mode="edit"
        initial={{
          id: routine.id,
          name: routine.name,
          prompt: routine.prompt,
          modelProvider: routine.modelProvider,
          modelName: routine.modelName,
          integrations: routine.integrations as string[],
          cronSchedule: routine.cronSchedule,
          maxSteps: routine.maxSteps,
        }}
      />
    </div>
  );
}
