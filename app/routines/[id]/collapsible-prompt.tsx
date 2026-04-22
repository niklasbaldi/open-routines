"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function CollapsiblePrompt({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span>Prompt</span>
      </button>
      {open && (
        <pre className="mt-2 text-xs text-neutral-700 bg-neutral-50 p-3 rounded-md whitespace-pre-wrap font-[family-name:var(--font-mono)]">
          {prompt}
        </pre>
      )}
    </div>
  );
}
