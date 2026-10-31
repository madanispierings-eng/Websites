"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";

type Ctx = { isDone: (id: string) => boolean; setDone: (id: string, done: boolean) => void; done: number; total: number };

const ProgressContext = createContext<Ctx | null>(null);

/**
 * Which objectives are ticked off, shared by the checkboxes and the progress card, so the card moves the moment a
 * box is ticked instead of waiting for the page to be fetched again.
 */
export function ObjectivesProgressProvider({ initialCompleted, objectiveIds, children }: {
  initialCompleted: string[];
  objectiveIds: string[];
  children: React.ReactNode;
}) {
  const [completed, setCompleted] = useState(() => new Set(initialCompleted));
  const setDone = useCallback((id: string, done: boolean) => {
    setCompleted((cur) => {
      if (cur.has(id) === done) return cur;
      const next = new Set(cur);
      if (done) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const value = useMemo<Ctx>(
    () => ({
      isDone: (id) => completed.has(id),
      setDone,
      done: objectiveIds.filter((id) => completed.has(id)).length,
      total: objectiveIds.length,
    }),
    [completed, objectiveIds, setDone],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useObjectivesProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useObjectivesProgress must be used inside ObjectivesProgressProvider");
  return ctx;
}

export function ObjectivesProgressSummary() {
  const { done, total } = useObjectivesProgress();
  return (
    <>
      <p className="mt-1 text-sm text-muted-ink" aria-live="polite">{done} van {total} leerdoelen afgevinkt</p>
      <Progress value={total ? (done / total) * 100 : 0} className="mt-3 h-2 bg-sky [&>*]:bg-success" aria-label="Leerdoelen afgevinkt" />
    </>
  );
}
