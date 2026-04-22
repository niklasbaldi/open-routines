import { RoutineForm } from "@/components/routines/routine-form";

export default function NewRoutinePage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">
        New Routine
      </h1>
      <RoutineForm mode="create" />
    </div>
  );
}
