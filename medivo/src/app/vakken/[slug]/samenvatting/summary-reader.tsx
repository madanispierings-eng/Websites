"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardCheck, Download, Search, Stethoscope } from "lucide-react";
import { ContentBlocks } from "@/components/content-blocks";
import { blockText } from "@/lib/content/text";
import type { Summary } from "@/lib/data/learning";
import { cn } from "@/lib/utils";

export type Chapter = Summary & {
  anchor: string;
  topicTitle: string;
  topicSlug: string;
};

export function SummaryReader({ chapters, course, watermark }: {
  chapters: Chapter[];
  course: { title: string; href: string };
  watermark?: string;
}) {
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  // Reading progress through the whole article, not the page.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(total <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / total) * 100)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return chapters
      .flatMap((c) =>
        c.blocks.flatMap((b, i) => {
          const text = blockText(b);
          const at = text.toLowerCase().indexOf(q);
          if (at < 0) return [];
          const start = Math.max(0, at - 40);
          return [{ href: `#${c.id}-b${i}`, chapter: c.title, snippet: `${start > 0 ? "…" : ""}${text.slice(start, at + q.length + 60)}…` }];
        }),
      )
      .slice(0, 30);
  }, [chapters, query]);

  return (
    <>
      <div
        className="fixed inset-x-0 top-16 z-30 h-0.5 bg-transparent lg:top-[4.5rem]"
        role="progressbar"
        aria-label="Leesvoortgang"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className="h-full origin-left bg-accent-blue" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      {/* On phones the sidebar scrolls away: keep a way back to the course in reach. */}
      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <Link href={course.href} className="inline-flex max-w-full items-center gap-1.5 rounded-md text-sm font-medium text-blue hover:underline">
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Terug naar {course.title}</span>
        </Link>
      </div>

      {/* On wide screens the reading column is centered in the viewport with symmetric gutters;
          the table of contents sits in the left gutter so the summary doesn't drift to the right. */}
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[minmax(15rem,1fr)_minmax(0,68rem)_minmax(15rem,1fr)] xl:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Link
            href={course.href}
            className="mb-4 hidden items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-navy shadow-[var(--shadow-card)] transition-colors hover:bg-sky lg:flex"
          >
            <ArrowLeft className="size-4 text-blue" aria-hidden="true" />
            <span className="truncate">Terug naar {course.title}</span>
          </Link>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
            <label htmlFor="zoek-samenvatting" className="sr-only">Zoeken in de samenvatting</label>
            <input
              id="zoek-samenvatting"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek in de samenvatting…"
              className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-base sm:text-sm"
            />
          </div>
          {query.trim().length >= 2 ? (
            <div className="mt-3 rounded-lg border border-line bg-white p-2" aria-live="polite">
              <p className="px-2 py-1 text-xs font-medium text-muted-ink">
                {results.length ? `${results.length} resultaten` : "Geen resultaten"}
              </p>
              <ul className="max-h-72 overflow-y-auto">
                {results.map((r) => (
                  <li key={r.href}>
                    <a href={r.href} className="block rounded-md px-2 py-2 text-sm hover:bg-sky">
                      <span className="block text-xs font-semibold text-navy">{r.chapter}</span>
                      <span className="text-muted-ink">{r.snippet}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <nav aria-label="Inhoudsopgave" className="mt-5">
            <h2 className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Inhoudsopgave</h2>
            <ol className="mt-2 space-y-0.5">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.anchor}`} className="flex gap-2 rounded-md px-2 py-1.5 text-sm text-navy hover:bg-sky">
                    <span className="w-4 shrink-0 text-right tabular-nums text-muted-ink">{i + 1}</span>
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div ref={articleRef} className="min-w-0 space-y-8">
          {chapters.map((c, i) => (
            <ChapterView key={c.id} chapter={c} index={i} total={chapters.length} watermark={watermark} />
          ))}
        </div>
      </div>
    </>
  );
}

function ChapterView({ chapter: c, index, total, watermark }: {
  chapter: Chapter;
  index: number;
  total: number;
  watermark?: string;
}) {
  const prev = index > 0;
  const next = index < total - 1;
  const hasAside = c.aside.clinical.length > 0 || c.aside.exam.length > 0;

  return (
    <article id={c.anchor} aria-labelledby={`${c.id}-titel`} className="scroll-mt-24">
      <div className={cn("grid gap-6", hasAside && "xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start")}>
        <div className="min-w-0 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-semibold text-blue">Hoofdstuk {index + 1}</span>
              <span className="text-xs font-medium text-muted-ink">van {total}</span>
            </span>
            <span className="flex items-center gap-1">
              {prev ? (
                <a href={`#${"prev"}`} onClick={jumpTo(index - 1)} className="grid size-8 place-items-center rounded-md border border-line text-navy hover:bg-sky" aria-label="Vorige hoofdstuk">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </a>
              ) : null}
              {next ? (
                <a href={`#${"next"}`} onClick={jumpTo(index + 1)} className="grid size-8 place-items-center rounded-md border border-line text-navy hover:bg-sky" aria-label="Volgende hoofdstuk">
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              ) : null}
              {c.pdfUrl ? (
                <a href={c.pdfUrl} className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-navy hover:bg-sky">
                  <Download className="size-4" aria-hidden="true" /> PDF
                </a>
              ) : null}
            </span>
          </div>
          <h2 id={`${c.id}-titel`} className="mt-3 text-2xl font-bold tracking-[-0.01em] text-navy sm:text-[1.75rem]">{c.title}</h2>

          <div className="mt-6">
            {c.invalid ? (
              <p className="text-sm text-danger">Dit hoofdstuk kon niet worden weergegeven. We zijn op de hoogte gebracht.</p>
            ) : (
              <ContentBlocks
                blocks={c.blocks}
                imageUrls={c.imageUrls}
                idPrefix={c.id}
                watermark={watermark}
                className="[&_h3]:mt-6 [&_h3]:border-b [&_h3]:border-line [&_h3]:pb-2 [&_h3]:text-xl [&_h4]:mt-4"
              />
            )}
          </div>
        </div>

        {hasAside ? (
          <aside className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto xl:overscroll-contain xl:pr-0.5" aria-label="Bij dit hoofdstuk">
            {c.aside.clinical.length ? (
              <SideCard title="Klinische relevantie" icon={Stethoscope} tone="clinical" items={c.aside.clinical} />
            ) : null}
            {c.aside.exam.length ? (
              <SideCard title="Tentamenfocus" icon={ClipboardCheck} tone="exam" items={c.aside.exam} />
            ) : null}
          </aside>
        ) : null}
      </div>
    </article>
  );
}

const toneStyles = {
  clinical: { head: "text-success-ink", icon: "text-success", mark: "text-success" },
  exam: { head: "text-danger", icon: "text-danger", mark: "text-danger" },
};

function SideCard({ title, icon: Icon, tone, items }: {
  title: string;
  icon: typeof Stethoscope;
  tone: keyof typeof toneStyles;
  items: string[];
}) {
  const t = toneStyles[tone];
  return (
    <div className="rounded-xl border border-line bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Icon className={cn("size-4", t.icon)} aria-hidden="true" />
        <h3 className={cn("text-sm font-semibold", t.head)}>{title}</h3>
      </div>
      <ul className="space-y-2.5 px-4 py-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-navy/90">
            <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", tone === "clinical" ? "bg-success" : "bg-danger")} aria-hidden="true" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Smooth-scroll to another chapter without touching the URL hash history.
function jumpTo(targetIndex: number) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const articles = document.querySelectorAll<HTMLElement>("article[id]");
    const el = articles[targetIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.querySelector<HTMLElement>("h2")?.focus?.();
    }
  };
}
