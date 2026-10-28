"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { setObjectiveCompleted } from "@/app/vakken/actions";
import { cn } from "@/lib/utils";

export function ObjectiveItem({ id, body, completed, canTrack, path }: {
  id: string;
  body: string;
  completed: boolean;
  canTrack: boolean;
  path: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(completed);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputId = `leerdoel-${id}`;

  return (
    <li className="flex items-start gap-3 py-3">
      <Checkbox
        id={inputId}
        checked={optimistic}
        disabled={!canTrack}
        aria-describedby={error ? `${inputId}-fout` : undefined}
        className="mt-0.5 size-5 border-[#b8c5d6] data-[state=checked]:border-success data-[state=checked]:bg-success"
        onCheckedChange={(value) => {
          const next = value === true;
          setError(null);
          startTransition(async () => {
            setOptimistic(next);
            const res = await setObjectiveCompleted({ objectiveId: id, completed: next, path });
            if (!res.ok) setError(res.error);
          });
        }}
      />
      <div className="flex-1">
        <label htmlFor={inputId} className={cn("text-[0.95rem] leading-relaxed text-navy", optimistic && "text-muted-ink")}>
          {body}
        </label>
        {error ? <p id={`${inputId}-fout`} role="alert" className="mt-1 text-sm text-danger">{error}</p> : null}
      </div>
    </li>
  );
}
