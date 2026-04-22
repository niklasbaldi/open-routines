const statusConfig: Record<string, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-neutral-100 text-neutral-600 border border-neutral-200" },
  running: { label: "Running", className: "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700 border border-green-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border border-red-200" },
  awaiting_confirmation: { label: "Awaiting", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-500 border border-neutral-200" },
};

export function RunStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-neutral-100 text-neutral-600 border border-neutral-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
