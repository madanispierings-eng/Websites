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
  selectedId,
  onSelect,
  disabled,
}: {
  courseTitle: string;
  topics: TopicNode[];
  counts: Record<string, number>;
  stats: TopicStats;
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const allIds = topics.flatMap((t) => [t.id, ...t.children.map((c) => c.id)]);
  const overall = aggregate(allIds, counts, stats);
  const pct = overall.total ? Math.round((overall.answered / overall.total) * 100) : 0;
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(topics.map((t) => [t.id, t.id === selectedId || t.children.some((c) => c.id === selectedId)])),
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
          const active = selectedId === t.id;
          return (
            <li key={t.id}>
              <div className={cn("flex items-center gap-1 rounded-lg", active && "bg-sky")}>
                <button
                  type="button"
                  disabled={disabled || agg.total === 0}
                  onClick={() => onSelect(t.id)}
                  aria-pressed={active}
                  className="flex min-h-11 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-navy enabled:hover:bg-sky/70 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border text-[0.7rem] font-semibold tabular-nums",
                      complete ? "border-success bg-success text-white" : "border-line text-muted-ink",
                    )}
                  >
                    {complete ? <Check className="size-3.5" strokeWidth={3} aria-label="Afgerond" /> : i + 1}
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
                          onClick={() => onSelect(c.id)}
                          aria-pressed={selectedId === c.id}
                          className={cn(
                            "flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[0.82rem] text-navy enabled:hover:bg-sky/70 disabled:cursor-not-allowed disabled:opacity-55",
                            selectedId === c.id && "bg-sky font-semibold",
                          )}
                        >
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
