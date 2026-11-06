"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { TopicNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export type TopicStats = Record<string, { answered: number; correct: number }>;

function aggregate(ids: string[], counts: Record<string, number>, stats: TopicStats) {
  return ids.reduce(
    (acc, id) => ({
      total: acc.total + (counts[id] ?? 0),
      answered: acc.answered + (stats[id]?.answered ?? 0),
      correct: acc.correct + (stats[id]?.correct ?? 0),
    }),
    { total: 0, answered: 0, correct: 0 },
  );
}

export function TopicSidebar({
  courseTitle,
  topics,
  counts,
  stats,
  selectedIds,
  onToggle,
  disabled,
}: {
  courseTitle: string;
  topics: TopicNode[];
  counts: Record<string, number>;
  stats: TopicStats;
  /** The topics chosen for "per onderwerp"; several may be selected at once. */
  selectedIds: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  const selected = new Set(selectedIds);
  const allIds = topics.flatMap((t) => [t.id, ...t.children.map((c) => c.id)]);
  const overall = aggregate(allIds, counts, stats);
  const pct = overall.total ? Math.round((overall.answered / overall.total) * 100) : 0;
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(topics.map((t) => [t.id, selectedIds.includes(t.id) || t.children.some((c) => selectedIds.includes(c.id))])),
  );

  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
      <h2 className="px-1 font-semibold text-navy">{courseTitle}</h2>
      <div className="mt-3 flex items-center gap-3 px-1">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-sky"
          role="progressbar"
          aria-label="Beantwoorde vragen in dit vak"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-navy">{pct}%</span>
      </div>

      <ol className="mt-4 space-y-0.5">
        {topics.map((t, i) => {
          const ids = [t.id, ...t.children.map((c) => c.id)];
          const agg = aggregate(ids, counts, stats);
          const complete = agg.total > 0 && agg.answered >= agg.total;
          const active = selected.has(t.id);
          return (
            <li key={t.id}>
              <div className={cn("flex items-center gap-1 rounded-lg", active && "bg-sky")}>
                <button
                  type="button"
                  disabled={disabled || agg.total === 0}
                  onClick={() => onToggle(t.id)}
                  aria-pressed={active}
                  className="flex min-h-11 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-navy enabled:hover:bg-sky/70 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md border text-[0.7rem] font-semibold tabular-nums",
                      active ? "border-accent-blue bg-accent-blue text-white" : complete ? "border-success bg-success text-white" : "border-line text-muted-ink",
                    )}
                  >
                    {active ? <Check className="size-3.5" strokeWidth={3} aria-label="Geselecteerd" /> : complete ? <Check className="size-3.5" strokeWidth={3} aria-label="Afgerond" /> : i + 1}
                  </span>
                  <span className={cn("flex-1", active && "font-semibold")}>{t.title}</span>
                  <span className="text-xs tabular-nums text-muted-ink" aria-label={`${agg.total} vragen`}>{agg.total}</span>
                </button>
                {t.children.length ? (
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))}
                    aria-expanded={Boolean(open[t.id])}
                    aria-label={`Subonderwerpen van ${t.title}`}
                    className="grid size-11 place-items-center rounded-lg text-navy/70 hover:bg-sky/70"
                  >
                    <ChevronDown className={cn("size-4 transition-transform", open[t.id] && "rotate-180")} />
                  </button>
                ) : null}
              </div>
              {t.children.length && open[t.id] ? (
                <ul className="mb-1 ml-5 border-l border-line pl-2">
                  {t.children.map((c) => {
                    const n = counts[c.id] ?? 0;
                    const s = stats[c.id];
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          disabled={disabled || n === 0}
                          onClick={() => onToggle(c.id)}
                          aria-pressed={selected.has(c.id)}
                          className={cn(
                            "flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[0.82rem] text-navy enabled:hover:bg-sky/70 disabled:cursor-not-allowed disabled:opacity-55",
                            selected.has(c.id) && "bg-sky font-semibold",
                          )}
                        >
                          <span className={cn("grid size-4 shrink-0 place-items-center rounded border", selected.has(c.id) ? "border-accent-blue bg-accent-blue text-white" : "border-line")} aria-hidden="true">
                            {selected.has(c.id) ? <Check className="size-3" strokeWidth={3} /> : null}
                          </span>
                          <span className="flex-1">{c.title}</span>
                          {s?.answered ? (
                            <span className="text-[0.7rem] tabular-nums text-success-ink">{Math.round((s.correct / s.answered) * 100)}% goed</span>
                          ) : null}
                          <span className="text-xs tabular-nums text-muted-ink">{n}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
