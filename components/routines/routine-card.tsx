"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Clock, Play } from "lucide-react";

interface RoutineCardProps {
  id: string;
  name: string;
  cronSchedule: string | null;
  isPaused: boolean;
  modelName: string;
  integrations: string[];
  onTogglePause: (id: string, paused: boolean) => void;
}

export function RoutineCard({
  id,
  name,
  cronSchedule,
  isPaused,
  modelName,
  integrations,
  onTogglePause,
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
                {cronSchedule}
              </span>
            )}
            <span>{modelName}</span>
            {integrations.length > 0 && (
              <span>{(integrations as string[]).join(", ")}</span>
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
