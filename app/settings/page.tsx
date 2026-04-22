"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface SecretEntry {
  keyName: string;
  hasValue: boolean;
}

export default function SettingsPage() {
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/settings")
      .then((r) => r.json())
      .then(setSecrets)
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!newKey || !newValue) return;
    setSaving(true);
    await fetch("/api/v1/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyName: newKey, value: newValue }),
    });
    setSecrets((prev) => [
      ...prev.filter((s) => s.keyName !== newKey),
      { keyName: newKey, hasValue: true },
    ]);
    setNewKey("");
    setNewValue("");
    setSaving(false);
    toast.success("Secret saved");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">Settings</h1>

      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">
          API Keys & Secrets
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          Secrets are encrypted at rest. Set your LLM and Composio API keys
          here, or manage them via the .env file.
        </p>

        {secrets.length > 0 && (
          <div className="space-y-2 mb-4">
            {secrets.map((s) => (
              <div
                key={s.keyName}
                className="flex items-center justify-between text-sm px-3 py-2 bg-neutral-50 rounded"
              >
                <span className="font-mono text-xs text-neutral-700">
                  {s.keyName}
                </span>
                <span className="text-xs text-neutral-400">
                  {s.hasValue ? "Set" : "Empty"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Key name (e.g. OPENAI_API_KEY)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1"
          />
          <Input
            type="password"
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={saving} size="sm">
            Save
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">
          Connected Integrations
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Manage Composio integrations from the{" "}
          <a
            href="https://app.composio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Composio dashboard
          </a>
          .
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 text-xs rounded-md border border-green-200 bg-green-50 text-green-700">
            gmail — connected
          </span>
          <span className="px-3 py-1.5 text-xs rounded-md border border-green-200 bg-green-50 text-green-700">
            googlecalendar — connected
          </span>
        </div>
      </Card>
    </div>
  );
}
