"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { setObjectiveCompleted } from "@/app/vakken/actions";
import { cn } from "@/lib/utils";

export function ObjectiveItem({ id, body, completed, canTrack, path, explanation }: {
  id: string;
  body: string;
  completed: boolean;
  canTrack: boolean;
  path: string;
  /** The worked-out explanation, rendered on the server; shown when the student expands the objective. */
  explanation?: React.ReactNode;
}) {
  const [optimistic, setOptimistic] = useOptimistic(completed);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const inputId = `leerdoel-${id}`;
  const panelId = useId();

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
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
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className={cn("text-[0.95rem] leading-relaxed text-navy", optimistic && "text-muted-ink")}>
            {body}
          </label>
          {error ? <p id={`${inputId}-fout`} role="alert" className="mt-1 text-sm text-danger">{error}</p> : null}
        </div>
        {explanation ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "-mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 max-sm:-my-2 max-sm:size-10 max-sm:justify-center max-sm:p-0 text-sm font-medium text-blue transition-colors hover:bg-sky",
              open && "bg-sky",
            )}
          >
            <span className="max-sm:sr-only">{open ? "Verberg uitleg" : "Uitleg"}</span>
            <ChevronDown className={cn("size-4 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {explanation ? (
        <div id={panelId} hidden={!open} className="mt-3 rounded-lg border border-line bg-canvas/60 px-3.5 py-4 sm:ml-8 sm:px-5 sm:py-5">
          {open ? explanation : null}
        </div>
      ) : null}
    </li>
  );
}
