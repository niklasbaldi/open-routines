"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { integrationLabel } from "@/lib/integrations";

const MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-6"],
  openai: ["gpt-4o", "gpt-4o-mini"],
  ollama: ["llama3.1", "llama3.2", "mistral", "qwen2.5", "gemma2"],
};

const INTEGRATIONS = ["gmail", "googlecalendar", "slack", "github", "notion"];

const SCHEDULE_PRESETS = [
  { label: "No schedule", value: "" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Daily at 7am", value: "0 7 * * *" },
  { label: "Daily at 9am", value: "0 9 * * *" },
  { label: "Weekdays at 8am", value: "0 8 * * 1-5" },
  { label: "Weekly (Monday 9am)", value: "0 9 * * 1" },
  { label: "Custom", value: "custom" },
];

interface RoutineFormProps {
  mode: "create" | "edit";
  initial?: {
    id?: string;
    name: string;
    prompt: string;
    modelProvider: string;
    modelName: string;
    integrations: string[];
    cronSchedule: string | null;
    maxSteps: number;
    timeoutSeconds?: number;
    notifyOnComplete?: string | null;
  };
}

export function RoutineForm({ mode, initial }: RoutineFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [provider, setProvider] = useState(initial?.modelProvider ?? "anthropic");
  const [model, setModel] = useState(initial?.modelName ?? "claude-sonnet-4-6");
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
    initial?.integrations ?? []
  );
  const [schedulePreset, setSchedulePreset] = useState(() => {
    if (!initial?.cronSchedule) return "";
    const match = SCHEDULE_PRESETS.find((p) => p.value === initial.cronSchedule);
    return match ? match.value : "custom";
  });
  const [customCron, setCustomCron] = useState(initial?.cronSchedule ?? "");
  const [maxSteps, setMaxSteps] = useState(initial?.maxSteps ?? 25);
  const [timeoutSeconds, setTimeoutSeconds] = useState(
    initial?.timeoutSeconds ?? 300
  );
  const [notifyOnComplete, setNotifyOnComplete] = useState(
    initial?.notifyOnComplete ?? ""
  );

  const cronSchedule =
    schedulePreset === "custom" ? customCron : schedulePreset || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      name,
      prompt,
      modelProvider: provider,
      modelName: model,
      integrations: selectedIntegrations,
      cronSchedule,
      maxSteps,
      timeoutSeconds,
      notifyOnComplete: notifyOnComplete || null,
    };

    if (mode === "create") {
      await fetch("/api/v1/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.push("/");
    } else {
      await fetch(`/api/v1/routines/${initial?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.push(`/routines/${initial?.id}`);
    }

    router.refresh();
  }

  function toggleIntegration(name: string) {
    setSelectedIntegrations((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning Briefing"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should the agent do?"
          rows={8}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Provider</label>
          <Select
            value={provider}
            onValueChange={(v) => {
              if (!v) return;
              setProvider(v);
              setModel(MODELS[v][0]);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="ollama">Ollama (local)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Model</label>
          <Select value={model} onValueChange={(v) => { if (v) setModel(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS[provider].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">
          Integrations
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => toggleIntegration(slug)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                selectedIntegrations.includes(slug)
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {integrationLabel(slug)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Schedule
          </label>
          <Select value={schedulePreset} onValueChange={(v) => { if (v !== null) setSchedulePreset(v); }}>
            <SelectTrigger>
              <SelectValue placeholder="No schedule" />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_PRESETS.map((p) => (
                <SelectItem key={p.value || "none"} value={p.value || "none"}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {schedulePreset === "custom" && (
            <Input
              value={customCron}
              onChange={(e) => setCustomCron(e.target.value)}
              placeholder="0 7 * * *"
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Max Steps
          </label>
          <Input
            type="number"
            value={maxSteps}
            onChange={(e) => setMaxSteps(Number(e.target.value))}
            min={1}
            max={50}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Timeout (seconds)
          </label>
          <Input
            type="number"
            value={timeoutSeconds}
            onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
            min={30}
            max={3600}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">
            Notify on complete
          </label>
          <Input
            value={notifyOnComplete}
            onChange={(e) => setNotifyOnComplete(e.target.value)}
            placeholder="gmail:you@example.com"
          />
          <p className="text-xs text-neutral-400">
            Format: gmail:email or slack:#channel
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : mode === "create" ? "Create Routine" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
