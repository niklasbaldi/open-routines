"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

interface PendingConfirmation {
  id: string;
  toolName: string;
  toolArgs: unknown;
  riskLevel: string;
}

export function ConfirmationBanner({
  confirmation,
}: {
  confirmation: PendingConfirmation;
}) {
  const router = useRouter();
  const [resolving, setResolving] = useState(false);

  async function resolve(approved: boolean) {
    setResolving(true);
    await fetch(`/api/v1/confirmations/${confirmation.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    router.refresh();
  }

  return (
    <Card className="border-amber-300 bg-amber-50 p-4 mb-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-900">
            Action requires approval
          </h3>
          <p className="text-sm text-amber-800 mt-1">
            <span className="font-mono font-medium">
              {confirmation.toolName}
            </span>{" "}
            — {confirmation.riskLevel} risk
          </p>
          {confirmation.toolArgs != null && (
            <pre className="text-xs text-amber-700 bg-amber-100 p-2 rounded mt-2 overflow-x-auto font-[family-name:var(--font-mono)]">
              {String(JSON.stringify(confirmation.toolArgs, null, 2))}
            </pre>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => resolve(true)}
              disabled={resolving}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => resolve(false)}
              disabled={resolving}
            >
              Deny
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
