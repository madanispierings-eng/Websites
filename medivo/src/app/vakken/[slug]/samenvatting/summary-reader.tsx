"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Search } from "lucide-react";
import { ContentBlocks } from "@/components/content-blocks";
import { blockText } from "@/lib/content/text";
import type { Summary } from "@/lib/data/learning";

type Chapter = Summary & { anchor: string; topicTitle: string };

export function SummaryReader({ chapters, course }: { chapters: Chapter[]; course: { title: string; href: string } }) {
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
    return chapters.flatMap((c) =>
      c.blocks.flatMap((b, i) => {
        const text = blockText(b);
        const at = text.toLowerCase().indexOf(q);
        if (at < 0) return [];
        const start = Math.max(0, at - 40);
        return [{ href: `#${c.id}-b${i}`, chapter: c.title, snippet: `${start > 0 ? "…" : ""}${text.slice(start, at + q.length + 60)}…` }];
      }),
    ).slice(0, 30);
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

      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
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

        <div ref={articleRef} className="min-w-0 space-y-6">
          {chapters.map((c, i) => (
            <article
              key={c.id}
              id={c.anchor}
              aria-labelledby={`${c.id}-titel`}
              className="scroll-mt-24 rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue">Hoofdstuk {i + 1} · {c.topicTitle}</p>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                <h2 id={`${c.id}-titel`} className="text-2xl font-bold tracking-[-0.01em] text-navy">{c.title}</h2>
                {c.pdfUrl ? (
                  <a href={c.pdfUrl} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-navy hover:bg-sky">
                    <Download className="size-4" aria-hidden="true" /> PDF
                  </a>
                ) : null}
              </div>
              <div className="mt-6">
                {c.invalid ? (
                  <p className="text-sm text-danger">Dit hoofdstuk kon niet worden weergegeven. We zijn op de hoogte gebracht.</p>
                ) : (
                  <ContentBlocks blocks={c.blocks} imageUrls={c.imageUrls} idPrefix={c.id} />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
