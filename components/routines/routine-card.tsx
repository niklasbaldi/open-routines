"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Clock, Play } from "lucide-react";
import { cronToHuman } from "@/lib/cron-display";
import { integrationLabel } from "@/lib/integrations";

interface RoutineCardProps {
  id: string;
  name: string;
  cronSchedule: string | null;
  isPaused: boolean;
  modelName: string;
  integrations: string[];
  onTogglePause: (id: string, paused: boolean) => void;
  lastRunStatus?: string | null;
  lastRunAt?: string | null;
}

function StatusDot({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="inline-block w-2 h-2 rounded-full bg-neutral-300" />;
  if (status === "completed") return <span className="inline-block w-2 h-2 rounded-full bg-green-500" />;
  if (status === "failed") return <span className="inline-block w-2 h-2 rounded-full bg-red-500" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-neutral-300" />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RoutineCard({
  id,
  name,
  cronSchedule,
  isPaused,
  modelName,
  integrations,
  onTogglePause,
  lastRunStatus,
  lastRunAt,
}: RoutineCardProps) {
  return (
    <Card className="p-4 hover:border-neutral-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/routines/${id}`} className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-neutral-900 truncate">
            {name}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
            {cronSchedule && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {cronToHuman(cronSchedule)}
              </span>
            )}
            <span>{modelName}</span>
            {integrations.length > 0 && (
              <span>{integrations.map(integrationLabel).join(", ")}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-400">
            <StatusDot status={lastRunStatus} />
            {lastRunAt ? (
              <span>Last run {timeAgo(lastRunAt)}</span>
            ) : (
              <span>Never run</span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/routines/${id}`}
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <Play className="h-4 w-4" />
          </Link>
          <Switch
            checked={!isPaused}
            onCheckedChange={(checked) => onTogglePause(id, !checked)}
            aria-label={isPaused ? "Resume routine" : "Pause routine"}
          />
        </div>
      </div>
    </Card>
  );
}
