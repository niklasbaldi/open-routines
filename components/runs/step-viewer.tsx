"use client";

import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface StepLog {
  stepNumber: number;
  timestamp: string;
  toolCalls?: Array<{
    toolName: string;
    input: unknown;
    riskLevel: string;
  }>;
  toolResults?: Array<{
    toolName: string;
    output: unknown;
    success: boolean;
  }>;
  text?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

const riskColors: Record<string, string> = {
  read: "bg-neutral-100 text-neutral-600",
  "write-low": "bg-blue-50 text-blue-700",
  "write-high": "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-700",
};

function CollapsibleJson({
  label,
  data,
}: {
  label: string;
  data: unknown;
}) {
  const [open, setOpen] = useState(false);
  const str = typeof data === "string" ? data : JSON.stringify(data as object, null, 2);
  const preview = str.slice(0, 100);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open ? (
        <pre className="mt-1 text-xs text-neutral-600 bg-neutral-50 p-2 rounded overflow-x-auto max-h-64 font-[family-name:var(--font-mono)]">
          {str}
        </pre>
      ) : (
        str.length > 0 && (
          <p className="text-xs text-neutral-400 mt-0.5 truncate font-[family-name:var(--font-mono)]">
            {preview}
            {str.length > 100 && "..."}
          </p>
        )
      )}
    </div>
  );
}

export function StepViewer({ steps }: { steps: StepLog[] }) {
  if (!steps || steps.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">No steps recorded.</p>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div
          key={i}
          className="relative pl-6 pb-4 border-l border-neutral-200 last:border-transparent"
        >
          <div className="absolute left-0 top-0 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-300" />

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-neutral-500">
              Step {step.stepNumber}
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(step.timestamp).toLocaleTimeString()}
            </span>
            {step.usage && (
              <span className="text-xs text-neutral-400">
                {(step.usage.inputTokens + step.usage.outputTokens).toLocaleString()} tokens
              </span>
            )}
          </div>

          {step.toolCalls?.map((tc, j) => (
            <div key={j} className="mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-800 font-[family-name:var(--font-mono)]">
                  {tc.toolName}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${riskColors[tc.riskLevel] ?? riskColors.read}`}
                >
                  {tc.riskLevel}
                </span>
              </div>
              {tc.input != null && <CollapsibleJson label="Input" data={tc.input} />}
            </div>
          ))}

          {step.toolResults?.map((tr, j) => (
            <div key={j} className="mb-1.5">
              <CollapsibleJson
                label={`Result: ${tr.toolName}${tr.success ? "" : " (failed)"}`}
                data={tr.output}
              />
            </div>
          ))}

          {step.text && (
            <p className="text-xs text-neutral-500 italic mt-1">
              Agent produced text
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
