"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff, Images, Maximize2, Minimize2, RotateCcw, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnatomyImage, AnatomyProgress, AnatomyStructure, AnatomyUnit } from "@/lib/data/anatomy";
import { ContentBlocks } from "@/components/content-blocks";
import type { ContentBlock } from "@/lib/content/blocks";
import { parseMarkup } from "@/lib/content/markup";
import { cn } from "@/lib/utils";
import { reviewAnatomy } from "@/app/vakken/[slug]/anatomie/actions";

type Confidence = "zeker" | "twijfel" | "gok";
type QType = "benoem" | "aanwijzen" | "typ";
type Question = { key: string; structureId: string; imageId: string; markerId: string; type: QType; options: string[] };
type Outcome = { structureId: string; correct: boolean; confidence: Confidence };

/** A short round; the main session asks every structure of the practicum once. */
const SHORT_ROUND = 20;

// ---------- answer checking ----------
const ABBR: [RegExp, string][] = [
  [/\barteriae\b/g, "aa"], [/\barteria\b/g, "a"], [/\bvenae\b/g, "vv"], [/\bvena\b/g, "v"],
  [/\bligamentum\b/g, "lig"], [/\bligamenta\b/g, "ligg"], [/\bnervus\b/g, "n"], [/\bmusculus\b/g, "m"],
];
export function normalise(s: string) {
  let t = s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/æ/g, "ae").replace(/œ/g, "oe");
  t = t.replace(/[.,;:()'"/-]/g, " ");
  for (const [re, r] of ABBR) t = t.replace(re, r);
  return t.replace(/\s+/g, " ").trim();
}
function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** Correct when the typed name matches the name or a synonym, allowing a small typo. */
export function typedIsCorrect(typed: string, s: AnatomyStructure) {
  const t = normalise(typed);
  if (!t) return false;
  return [s.name, ...s.synonyms].some((n) => {
    const c = normalise(n);
    return t === c || distance(t, c) <= Math.max(1, Math.floor(c.length / 9));
  });
}

const shuffle = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// ---------- mastery ----------
type Status = "nieuw" | "aandacht" | "bezig" | "beheerst";
function statusOf(p: AnatomyProgress | undefined): Status {
  if (!p) return "nieuw";
  if (!p.lastCorrect) return "aandacht";
  if (p.box >= 2) return "beheerst";
  return "bezig";
}

type Counts = { nieuw: number; aandacht: number; bezig: number; beheerst: number };
function countStatus(ids: string[], progress: Record<string, AnatomyProgress>): Counts {
  const c = { nieuw: 0, aandacht: 0, bezig: 0, beheerst: 0 };
  for (const id of ids) c[statusOf(progress[id])]++;
  return c;
}

/** A practicum with only what the viewer can practise: its checklist, its plates (markers outside the checklist unnumbered). */
function scopeUnit(unit: AnatomyUnit, images: AnatomyImage[], byIdAll: Map<string, AnatomyStructure>) {
  const ids = unit.items.map((i) => i.structureId).filter((id) => byIdAll.has(id));
  const set = new Set(ids);
  const unitImages = images
    .filter((img) => img.unitId === unit.id)
    .map((img) => ({ ...img, markers: img.markers.map((m) => (m.structureId && set.has(m.structureId) ? m : { ...m, structureId: null })) }));
  const onPlate = new Set<string>();
  for (const img of unitImages) for (const m of img.markers) if (m.structureId) onPlate.add(m.structureId);
  const byId = new Map(ids.map((id) => [id, byIdAll.get(id)!]));
  return { ids, practisable: ids.filter((id) => onPlate.has(id)), images: unitImages, byId };
}

export function AnatomyStudio({
  units,
  structures,
  images,
  initialProgress,
  initialUnit,
}: {
  units: AnatomyUnit[];
  structures: AnatomyStructure[];
  images: AnatomyImage[];
  initialProgress: Record<string, AnatomyProgress>;
  initialUnit: string | null;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [unitSlug, setUnitSlug] = useState<string | null>(units.some((u) => u.slug === initialUnit) ? initialUnit : null);
  const [view, setView] = useState<{ kind: "unit" } | { kind: "oefenen"; ids: string[] } | { kind: "platen"; imageId?: string }>({ kind: "unit" });
  const byIdAll = useMemo(() => new Map(structures.map((s) => [s.id, s])), [structures]);
  const unit = units.find((u) => u.slug === unitSlug) ?? null;
  const scoped = useMemo(() => (unit ? scopeUnit(unit, images, byIdAll) : null), [unit, images, byIdAll]);

  // Keep the chosen practicum in the address bar, so a refresh or a shared link opens it again.
  const openUnit = (slug: string | null) => {
    setUnitSlug(slug);
    setView({ kind: "unit" });
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("practicum", slug);
    else url.searchParams.delete("practicum");
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  };

  const record = (o: Outcome) => {
    setProgress((p) => {
      const cur = p[o.structureId];
      const box = !o.correct ? 0 : o.confidence === "zeker" ? Math.min((cur?.box ?? 0) + 1, 5) : cur?.box ?? 0;
      return { ...p, [o.structureId]: { box, reviews: (cur?.reviews ?? 0) + 1, lastCorrect: o.correct, lastConfidence: o.confidence, dueAt: new Date().toISOString() } };
    });
    void reviewAnatomy(o);
  };

  if (!unit || !scoped) return <UnitGrid units={units} images={images} byIdAll={byIdAll} progress={progress} onOpen={openUnit} />;

  if (view.kind === "oefenen")
    return (
      <Session
        key={view.ids.join()}
        ids={view.ids}
        byId={scoped.byId}
        images={scoped.images}
        unit={unit}
        progress={progress}
        onRecord={record}
        onExit={() => setView({ kind: "unit" })}
        onAgain={(ids) => setView({ kind: "oefenen", ids })}
      />
    );
  if (view.kind === "platen")
    return <PlateBrowser images={scoped.images} byId={scoped.byId} initial={view.imageId} onBack={() => setView({ kind: "unit" })} />;

  return (
    <UnitDetail
      unit={unit}
      scoped={scoped}
      progress={progress}
      onBack={() => openUnit(null)}
      onStart={(ids) => setView({ kind: "oefenen", ids })}
      onPlates={(imageId) => setView({ kind: "platen", imageId })}
    />
  );
}

// ---------- the practica ----------
/** "PR Macroscopische Anatomie 1" reads better on a card as "Macroscopische anatomie 1". */
const cardTitle = (t: string) => t.replace(/^PR\s+/i, "").replace(/^Macroscopische Anatomie/i, "Macroscopische anatomie");

function UnitGrid({
  units,
  images,
  byIdAll,
  progress,
  onOpen,
}: {
  units: AnatomyUnit[];
  images: AnatomyImage[];
  byIdAll: Map<string, AnatomyStructure>;
  progress: Record<string, AnatomyProgress>;
  onOpen: (slug: string) => void;
}) {
  const allIds = [...new Set(units.flatMap((u) => u.items.map((x) => x.structureId)).filter((id) => byIdAll.has(id)))];
  const all = countStatus(allIds, progress);
  const practised = allIds.length - all.nieuw;
  const pctAll = allIds.length ? Math.round((all.beheerst / allIds.length) * 100) : 0;
  return (
    <div className="space-y-6">
      <section aria-labelledby="anatomie-voortgang" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 id="anatomie-voortgang" className="text-sm font-semibold text-muted-ink">Jouw voortgang over alle practica</h2>
            <p className="mt-1 text-2xl font-bold tracking-tight text-navy">
              <span className="tabular-nums">{all.beheerst}</span>
              <span className="text-base font-medium text-muted-ink"> van {allIds.length} structuren beheerst</span>
            </p>
          </div>
          <p className="text-sm text-muted-ink">
            {practised ? <><span className="tabular-nums font-semibold text-navy">{practised}</span> al geoefend</> : "Kies een practicum om te beginnen"}
          </p>
        </div>
        <StatusBar c={all} total={allIds.length} className="mt-4 h-2.5" />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-ink">
          <Legend className="bg-success">Beheerst <span className="tabular-nums">{all.beheerst}</span></Legend>
          <Legend className="bg-accent-blue/60">Mee bezig <span className="tabular-nums">{all.bezig}</span></Legend>
          <Legend className="bg-danger/70">Fout, komt terug <span className="tabular-nums">{all.aandacht}</span></Legend>
          <Legend className="bg-line">Nog niet geoefend <span className="tabular-nums">{all.nieuw}</span></Legend>
          <span className="sr-only">{pctAll}% beheerst</span>
        </div>
      </section>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u, i) => {
          const ids = u.items.map((x) => x.structureId).filter((id) => byIdAll.has(id));
          const c = countStatus(ids, progress);
          const ready = ids.length > 0;
          const plates = images.filter((img) => img.unitId === u.id);
          // The richest modern plate gives the best impression of the practicum (old engravings only as fallback).
          const modern = plates.filter((img) => !/gray|toldt/i.test(img.credit));
          const cover = (modern.length ? modern : plates).reduce<AnatomyImage | undefined>((best, img) => (!best || img.markers.length > best.markers.length ? img : best), undefined);
          const done = ids.length - c.nieuw;
          const pct = ids.length ? Math.round((c.beheerst / ids.length) * 100) : 0;
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onOpen(u.slug)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-white text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
              >
                <span className="relative block aspect-[16/10] overflow-hidden border-b border-line bg-white">
                  {cover ? (
                    // Signed, short-lived URL from private storage; next/image would cache it past its expiry.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover.url}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  ) : null}
                  <span className="absolute left-3 top-3 rounded-full bg-navy/90 px-2.5 py-1 text-xs font-semibold text-white">Practicum {i + 1}</span>
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="text-lg font-semibold leading-snug text-navy">{cardTitle(u.title)}</span>
                  {u.subtitle ? <span className="mt-1.5 text-sm leading-relaxed text-muted-ink">{u.subtitle}</span> : null}
                  <span className="mt-auto pt-5">
                    {ready ? (
                      <>
                        <span className="flex items-baseline justify-between gap-2 text-xs text-muted-ink">
                          <span>
                            <span className="tabular-nums font-semibold text-navy">{ids.length}</span> structuren · {plates.length} platen
                          </span>
                          <span className="tabular-nums">{c.beheerst ? `${pct}% beheerst` : done ? `${done} geoefend` : "Nog niet geoefend"}</span>
                        </span>
                        <StatusBar c={c} total={ids.length} className="mt-2 h-2" />
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue">
                          {done ? "Verder oefenen" : "Start met oefenen"}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-muted-ink">Wordt voorbereid</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusBar({ c, total, className }: { c: Counts; total: number; className?: string }) {
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  return (
    <span className={cn("flex h-1.5 overflow-hidden rounded-full bg-canvas", className)} aria-hidden="true">
      <span className="bg-success" style={{ width: pct(c.beheerst) }} />
      <span className="bg-accent-blue/60" style={{ width: pct(c.bezig) }} />
      <span className="bg-danger/70" style={{ width: pct(c.aandacht) }} />
    </span>
  );
}

const STATUS_LABEL: Record<Status, string> = { nieuw: "Nog niet geoefend", bezig: "Mee bezig", beheerst: "Beheerst", aandacht: "Fout, komt terug" };
function StatusIcon({ s }: { s: Status }) {
  return (
    <span
      title={STATUS_LABEL[s]}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border-2",
        s === "nieuw" && "border-line",
        s === "bezig" && "border-accent-blue/60 bg-accent-blue/15",
        s === "beheerst" && "border-success bg-success text-white",
        s === "aandacht" && "border-danger bg-danger text-white",
      )}
    >
      {s === "beheerst" ? <Check className="size-3" aria-hidden="true" /> : s === "aandacht" ? <X className="size-3" aria-hidden="true" /> : null}
      <span className="sr-only">{STATUS_LABEL[s]}</span>
    </span>
  );
}

/** The checklist of a practicum, grouped by category, with level and status per structure. */
function Checklist({ unit, byId, progress, compact }: { unit: AnatomyUnit; byId: Map<string, AnatomyStructure>; progress: Record<string, AnatomyProgress>; compact?: boolean }) {
  // Grouped per category, categories in order of first appearance.
  const map = new Map<string, string[]>();
  for (const it of unit.items) {
    if (!byId.has(it.structureId)) continue;
    map.set(it.category, [...(map.get(it.category) ?? []), it.structureId]);
  }
  const groups = [...map.entries()].map(([category, ids]) => ({ category, ids }));
  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      {groups.map((g) => (
        <section key={g.category}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">{g.category}</h3>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {g.ids.map((id) => {
              const s = byId.get(id)!;
              return (
                <li key={id} className="flex items-center gap-3 px-3 py-2">
                  <StatusIcon s={statusOf(progress[id])} />
                  <span className="min-w-0 flex-1 text-sm text-navy">
                    {s.name}
                    {s.dutchName && !compact ? <span className="text-muted-ink"> · {s.dutchName}</span> : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                      s.level === "toepassen" ? "bg-sky text-blue" : "bg-canvas text-muted-ink",
                    )}
                  >
                    {s.level === "toepassen" ? "Toepassen" : "Basis"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function UnitDetail({
  unit,
  scoped,
  progress,
  onBack,
  onStart,
  onPlates,
}: {
  unit: AnatomyUnit;
  scoped: ReturnType<typeof scopeUnit>;
  progress: Record<string, AnatomyProgress>;
  onBack: () => void;
  onStart: (ids: string[]) => void;
  onPlates: (imageId?: string) => void;
}) {
  const { ids, practisable, images, byId } = scoped;
  const c = countStatus(ids, progress);
  const now = Date.now();
  const toRepeat = practisable.filter((id) => statusOf(progress[id]) === "aandacht");
  // Session order: wrong first, then due, then new, then the rest; shuffled within each group.
  const startSession = (limit?: number) => {
    const rank = (id: string) => {
      const p = progress[id];
      if (p && !p.lastCorrect) return 0;
      if (p && new Date(p.dueAt).getTime() <= now) return 1;
      if (!p) return 2;
      return 3 + p.box;
    };
    const groups = new Map<number, string[]>();
    for (const id of practisable) groups.set(rank(id), [...(groups.get(rank(id)) ?? []), id]);
    onStart([...groups.keys()].sort((a, b) => a - b).flatMap((k) => shuffle(groups.get(k)!)).slice(0, limit ?? practisable.length));
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Alle practica
      </button>
      <h2 className="text-2xl font-bold tracking-[-0.01em] text-navy">{cardTitle(unit.title)}</h2>
      {unit.subtitle ? <p className="mt-1 text-muted-ink">{unit.subtitle}</p> : null}

      {!ids.length ? (
        <p className="mt-6 rounded-xl border border-dashed border-line bg-white p-6 text-sm text-muted-ink">
          Dit practicum wordt voorbereid. Zodra de structuren en platen klaar zijn, zie je hier wat je moet kennen en kun je oefenen.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            {unit.mustKnow ? <MustKnow source={unit.mustKnow} idPrefix={`${unit.id}-weten`} /> : null}
            <section className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-navy">Deze structuren moet je kennen</h3>
                <span className="shrink-0 text-sm tabular-nums text-muted-ink">
                  {c.beheerst} van {ids.length} beheerst
                </span>
              </div>
              <StatusBar c={c} total={ids.length} className="mt-3" />
              <p className="mt-3 text-sm text-muted-ink">
                <span className="font-semibold text-blue">Toepassen</span>: aanwijzen, benoemen én kunnen toepassen (ligging, relaties, klinisch).{" "}
                <span className="font-semibold text-navy">Basis</span>: aanwijzen en benoemen.
              </p>
              <div className="mt-5">
                <Checklist unit={unit} byId={byId} progress={progress} />
              </div>
            </section>
          </div>

          {/* On a phone the practice buttons come first, above the long lists. */}
          <aside className="order-first space-y-4 lg:sticky lg:top-24 lg:order-none">
            <section className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
              <h3 className="text-lg font-semibold text-navy">Oefenen</h3>
              <p className="mt-1 text-sm text-muted-ink">
                Meerkeuzevragen over alle structuren van dit practicum: welke structuur is aangewezen? Wat je fout had of gokte, komt
                eerder terug. Je kunt altijd stoppen; je voortgang wordt per vraag bewaard.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Button type="button" className="h-auto min-h-11 py-2 font-semibold" onClick={() => startSession()} disabled={!practisable.length}>
                  <Target className="size-4" aria-hidden="true" />
                  Oefen alle structuren ({practisable.length} vragen)
                </Button>
                {practisable.length > SHORT_ROUND ? (
                  <Button type="button" variant="outline" className="h-11" onClick={() => startSession(SHORT_ROUND)}>
                    <Target className="size-4" aria-hidden="true" />
                    Korte ronde ({SHORT_ROUND} vragen)
                  </Button>
                ) : null}
                {toRepeat.length ? (
                  <Button type="button" variant="outline" className="h-11" onClick={() => onStart(shuffle(toRepeat))}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Herhaal wat je fout had ({toRepeat.length})
                  </Button>
                ) : null}
                <Button type="button" variant="outline" className="h-11" onClick={() => onPlates()} disabled={!images.length}>
                  <Images className="size-4" aria-hidden="true" />
                  Platen bekijken ({images.length})
                </Button>
              </div>
              {practisable.length < ids.length ? (
                <p className="mt-3 text-xs text-muted-ink">{ids.length - practisable.length} structuren staan nog niet op een plaat en worden nog niet gevraagd.</p>
              ) : null}
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-ink">
                <Legend className="bg-success">Beheerst</Legend>
                <Legend className="bg-accent-blue/60">Mee bezig</Legend>
                <Legend className="bg-danger/70">Fout</Legend>
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

/**
 * "Wat moet je weten?" as a short intro plus one collapsible section per preparaat (the ### headings of the text),
 * so the page stays scannable instead of one long wall of bullet points.
 */
function MustKnow({ source, idPrefix }: { source: string; idPrefix: string }) {
  const { intro, sections } = useMemo(() => {
    const intro: ContentBlock[] = [];
    const sections: { title: string; blocks: ContentBlock[] }[] = [];
    for (const b of parseMarkup(source)) {
      if (b.type === "heading") sections.push({ title: b.text, blocks: [] });
      else (sections.at(-1)?.blocks ?? intro).push(b);
    }
    return { intro, sections };
  }, [source]);
  const points = (bs: ContentBlock[]) => bs.reduce((n, b) => n + (b.type === "list" ? b.items.length : 1), 0);
  const text = "space-y-3 text-[0.95rem] leading-relaxed text-navy";
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h3 className="text-lg font-semibold text-navy">Wat moet je weten?</h3>
      {intro.length ? <ContentBlocks blocks={intro} imageUrls={{}} idPrefix={`${idPrefix}-intro`} className={cn("mt-2", text)} /> : null}
      {sections.length ? (
        <>
          <p className="mt-3 text-sm text-muted-ink">Klap een onderdeel open voor de punten die je moet kennen.</p>
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line">
            {sections.map((sec, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-canvas [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1 font-semibold text-navy">{sec.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-ink">{points(sec.blocks)} punten</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-ink transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                </summary>
                <div className="border-t border-line bg-canvas/40 px-4 py-4">
                  <ContentBlocks blocks={sec.blocks} imageUrls={{}} idPrefix={`${idPrefix}-${i}`} className={text} />
                </div>
              </details>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function Legend({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} aria-hidden="true" />
      {children}
    </span>
  );
}

// ---------- the plate ----------
const LINE: Record<MarkState, string> = {
  target: "#1760b5",
  picked: "#1760b5",
  correct: "#16a085",
  wrong: "#c0392b",
  plain: "#0b2345",
  "hidden-number": "#0b2345",
  dim: "transparent",
};
/** Numbers 1..n for the tested markers only, top to bottom, so numbering has no gaps. */
function numbering(image: AnatomyImage) {
  const tested = image.markers.filter((m) => m.structureId).sort((a, b) => a.y - b.y || a.x - b.x);
  return new Map(tested.map((m, i) => [m.id, i + 1]));
}

type MarkState = "target" | "plain" | "hidden-number" | "correct" | "wrong" | "picked" | "dim";
function Plate({
  image,
  marks,
  labels,
  onMarkerClick,
  zoomTo,
}: {
  image: AnatomyImage;
  marks: (m: AnatomyImage["markers"][number]) => MarkState;
  labels?: (m: AnatomyImage["markers"][number]) => string | null;
  onMarkerClick?: (markerId: string) => void;
  zoomTo?: string;
}) {
  const [zoom, setZoom] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);
  const ready = loaded === image.id;
  const scroller = useRef<HTMLDivElement>(null);
  const numbers = numbering(image);
  useEffect(() => {
    const el = scroller.current;
    const m = image.markers.find((x) => x.id === zoomTo);
    if (!el || !zoom || !m) return;
    el.scrollTo({ left: m.x * el.scrollWidth - el.clientWidth / 2, top: m.y * el.scrollHeight - el.clientHeight / 2 });
  }, [zoom, zoomTo, image]);
  return (
    <div className="relative">
      <div ref={scroller} className={cn("rounded-xl border border-line bg-white", zoom ? "max-h-[75vh] overflow-auto" : "overflow-hidden")}>
        {/* Not zoomed: the whole plate fits on screen (height-limited), so the asked point is always visible. */}
        {/* Keyed by plate: a new <img> per plate, so the previous plate never shows under the new numbers while loading. */}
        <div
          key={image.id}
          className="relative mx-auto [--ph:56svh] lg:[--ph:calc(100vh-13rem)]"
          style={{ width: zoom ? "200%" : `min(100%, calc(var(--ph) * ${image.width / image.height}))` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.title}
            width={image.width}
            height={image.height}
            onLoad={() => setLoaded(image.id)}
            className="block h-auto w-full select-none bg-canvas"
            style={{ aspectRatio: `${image.width} / ${image.height}` }}
            draggable={false}
          />
          {/* The printed leader lines are too thin to follow: draw a clear line from each number to the structure. */}
          <svg
            viewBox={`0 0 ${image.width} ${image.height}`}
            preserveAspectRatio="none"
            className={cn("pointer-events-none absolute inset-0 size-full transition-opacity", ready ? "opacity-100" : "opacity-0")}
            aria-hidden="true"
          >
            {image.markers.map((m) => {
              const st = marks(m);
              if (!m.tip || st === "dim") return null;
              const col = LINE[st];
              const x1 = m.x * image.width, y1 = m.y * image.height, x2 = m.tip.x * image.width, y2 = m.tip.y * image.height;
              const strong = st !== "plain" && st !== "hidden-number";
              return (
                <g key={m.id} opacity={strong ? 1 : 0.85}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={strong ? 7 : 5.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={strong ? 3.5 : 2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <circle cx={x2} cy={y2} r={strong ? 16 : 12} fill={col} stroke="white" strokeWidth={3} vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </svg>
          {image.markers.map((m) => {
            const st = marks(m);
            const label = labels?.(m);
            const clickable = !!onMarkerClick && !!m.structureId;
            const Tag = clickable ? "button" : "span";
            return (
              <Tag
                key={m.id}
                {...(clickable ? { type: "button" as const, onClick: () => onMarkerClick!(m.id), "aria-label": `Punt ${numbers.get(m.id)}` } : { "aria-hidden": true })}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity",
                  !ready && "pointer-events-none opacity-0",
                  st === "dim" && "size-2.5 bg-navy/35",
                  st !== "dim" && "grid size-5 place-items-center border-2 bg-white text-[0.6rem] font-bold shadow-sm sm:size-8 sm:text-xs",
                  st === "plain" && "border-navy/60 text-navy",
                  st === "hidden-number" && "border-navy/60 text-transparent",
                  st === "picked" && "border-blue bg-blue text-white",
                  st === "target" && "z-10 size-9 border-white bg-blue text-sm text-white shadow-[0_0_0_3px_var(--color-blue),0_4px_12px_rgba(11,35,69,0.35)] sm:size-10",
                  st === "correct" && "border-success bg-success text-white ring-4 ring-success/30",
                  st === "wrong" && "border-danger bg-danger text-white ring-4 ring-danger/25",
                  clickable && "cursor-pointer hover:border-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue",
                )}
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
              >
                {st === "target" ? <span className="absolute inset-0 rounded-full bg-blue/40 motion-safe:animate-ping" aria-hidden="true" /> : null}
                {st === "dim" ? null : st === "target" ? <span className="relative">?</span> : st === "correct" ? <Check className="size-4" aria-hidden="true" /> : st === "wrong" ? <X className="size-4" aria-hidden="true" /> : numbers.get(m.id)}
                {label ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[0.7rem] font-semibold text-white shadow",
                      m.x > 0.55 ? "right-full mr-1.5" : "left-full ml-1.5",
                    )}
                  >
                    {label}
                  </span>
                ) : null}
              </Tag>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setZoom((z) => !z)}
        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm hover:bg-white"
      >
        {zoom ? <Minimize2 className="size-3.5" aria-hidden="true" /> : <Maximize2 className="size-3.5" aria-hidden="true" />}
        {zoom ? "Verkleinen" : "Vergroten"}
      </button>
      <p className="mt-1.5 text-[0.7rem] text-muted-ink">{image.credit}</p>
    </div>
  );
}

// ---------- practice session ----------
function buildQuestion(structureId: string, images: AnatomyImage[], byId: Map<string, AnatomyStructure>, prefer?: QType): Question {
  const withMarker = images.flatMap((img) => img.markers.filter((m) => m.structureId === structureId).map((m) => ({ img, m })));
  const { img, m } = pick(withMarker);
  const others = [...new Set(img.markers.map((x) => x.structureId).filter((x): x is string => !!x && x !== structureId))];
  // For now only multiple choice ("which structure is pointed out?"); pointing and typing may come back later.
  const type: QType = prefer ?? "benoem";
  const target = byId.get(structureId)!;
  // Distractors: other structures on the same plate, preferring the same region; then the same region elsewhere.
  const same = shuffle(others).sort((a, b) => Number(byId.get(b)?.region === target.region) - Number(byId.get(a)?.region === target.region));
  const rest = [...byId.values()].filter((s) => s.id !== structureId && !same.includes(s.id));
  const extra = [...shuffle(rest.filter((s) => s.region === target.region)), ...shuffle(rest.filter((s) => s.region !== target.region))].map((s) => s.id);
  const options = shuffle([structureId, ...[...same, ...extra].slice(0, 3)]);
  return { key: `${structureId}-${Math.random()}`, structureId, imageId: img.id, markerId: m.id, type, options };
}

function Session({
  ids,
  byId,
  images,
  unit,
  progress,
  onRecord,
  onExit,
  onAgain,
}: {
  ids: string[];
  byId: Map<string, AnatomyStructure>;
  images: AnatomyImage[];
  unit: AnatomyUnit;
  progress: Record<string, AnatomyProgress>;
  onRecord: (o: Outcome) => void;
  onExit: () => void;
  onAgain: (ids: string[]) => void;
}) {
  const [queue, setQueue] = useState<Question[]>(() => ids.map((id) => buildQuestion(id, images, byId)));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Outcome[]>([]);
  const q = queue[index];

  if (!q) {
    const firstTry = new Map<string, Outcome>();
    for (const r of results) if (!firstTry.has(r.structureId)) firstTry.set(r.structureId, r);
    const list = [...firstTry.values()];
    const good = list.filter((r) => r.correct && r.confidence === "zeker").length;
    const wrong = list.filter((r) => !r.correct).map((r) => r.structureId);
    const unsure = list.filter((r) => r.correct && r.confidence !== "zeker").map((r) => r.structureId);
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h2 className="text-2xl font-bold tracking-[-0.01em] text-navy">Sessie klaar</h2>
        <p className="mt-2 text-muted-ink">
          {good} van {list.length} in één keer goed en zeker.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat n={good} label="Goed en zeker" className="text-success-ink" />
          <Stat n={unsure.length} label="Goed, met twijfel" className="text-blue" />
          <Stat n={wrong.length} label="Fout" className="text-danger" />
        </div>
        {wrong.length || unsure.length ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-navy">Komt eerder terug</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {[...wrong, ...unsure].map((id) => (
                <li key={id} className={cn("rounded-full px-3 py-1 text-sm", wrong.includes(id) ? "bg-danger-soft text-danger" : "bg-sky text-navy")}>
                  {byId.get(id)?.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          {wrong.length || unsure.length ? (
            <Button type="button" className="h-11 px-5 font-semibold" onClick={() => onAgain([...wrong, ...unsure])}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Oefen deze nog een keer
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="h-11 px-5" onClick={onExit}>
            Terug naar het overzicht
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QuestionView
      key={q.key}
      q={q}
      n={index + 1}
      total={queue.length}
      byId={byId}
      image={images.find((i) => i.id === q.imageId)!}
      unit={unit}
      progress={progress}
      onExit={onExit}
      onDone={(o) => {
        onRecord(o);
        setResults((r) => [...r, o]);
        // Wrong: ask it again a few questions later, as a multiple-choice question on (maybe) another plate.
        if (!o.correct) {
          const again = buildQuestion(o.structureId, images, byId, "benoem");
          setQueue((x) => [...x.slice(0, index + 1), ...x.slice(index + 1, index + 4), again, ...x.slice(index + 4)]);
        }
        setIndex((i) => i + 1);
      }}
    />
  );
}

function Stat({ n, label, className }: { n: number; label: string; className: string }) {
  return (
    <div className="rounded-lg bg-canvas px-3 py-3">
      <p className={cn("text-2xl font-bold tabular-nums", className)}>{n}</p>
      <p className="mt-0.5 text-xs text-muted-ink">{label}</p>
    </div>
  );
}

const PROMPT: Record<QType, string> = {
  benoem: "Welke structuur is aangewezen?",
  typ: "Typ de naam van de aangewezen structuur.",
  aanwijzen: "Wijs deze structuur aan op de plaat.",
};

function QuestionView({
  q,
  n,
  total,
  byId,
  image,
  unit,
  progress,
  onExit,
  onDone,
}: {
  q: Question;
  n: number;
  total: number;
  byId: Map<string, AnatomyStructure>;
  image: AnatomyImage;
  unit: AnatomyUnit;
  progress: Record<string, AnatomyProgress>;
  onExit: () => void;
  onDone: (o: Outcome) => void;
}) {
  const target = byId.get(q.structureId)!;
  const [choice, setChoice] = useState<string | null>(null); // structure id (benoem) or marker id (aanwijzen)
  const [typed, setTyped] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [checked, setChecked] = useState<null | { correct: boolean; pickedStructure: string | null }>(null);
  const next = useRef<HTMLButtonElement>(null);
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (checked) next.current?.focus({ preventScroll: true });
  }, [checked]);
  // Each question starts with the plate in view.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" });
  }, []);

  const answered = q.type === "typ" ? typed.trim().length > 0 : !!choice;
  const check = () => {
    if (!answered || !confidence) return;
    let correct = false;
    let pickedStructure: string | null = null;
    if (q.type === "benoem") {
      pickedStructure = choice;
      correct = choice === q.structureId;
    } else if (q.type === "aanwijzen") {
      pickedStructure = image.markers.find((m) => m.id === choice)?.structureId ?? null;
      correct = pickedStructure === q.structureId;
    } else {
      correct = typedIsCorrect(typed, target);
    }
    setChecked({ correct, pickedStructure });
  };

  const marks = (m: AnatomyImage["markers"][number]): MarkState => {
    if (!m.structureId) return "dim";
    if (q.type === "aanwijzen") {
      if (checked) {
        if (m.structureId === q.structureId) return "correct";
        if (m.id === choice) return "wrong";
        return "hidden-number";
      }
      return m.id === choice ? "picked" : "hidden-number";
    }
    if (m.id === q.markerId) return checked ? (checked.correct ? "correct" : "wrong") : "target";
    return "dim";
  };
  const picked = checked?.pickedStructure && checked.pickedStructure !== q.structureId ? byId.get(checked.pickedStructure) : null;

  return (
    <div ref={top} className="scroll-mt-20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Stoppen
        </button>
        <p className="text-sm tabular-nums text-muted-ink">
          Vraag {n} van {total}
        </p>
      </div>
      {/* Always clear what you are practising: the practicum and its checklist, one tap away. */}
      <details className="group mb-4 rounded-xl border border-line bg-white px-4 py-3 shadow-[var(--shadow-card)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm">
          <span className="min-w-0">
            <span className="text-muted-ink">Je oefent: </span>
            <span className="font-semibold text-navy">{unit.title}</span>
            <span className="text-muted-ink"> · {byId.size} te kennen structuren</span>
          </span>
          <span className="shrink-0 font-medium text-blue group-open:hidden">Toon checklist</span>
          <span className="hidden shrink-0 font-medium text-blue group-open:inline">Verberg</span>
        </summary>
        <div className="mt-4 max-h-[50vh] overflow-auto pr-1">
          <Checklist unit={unit} byId={byId} progress={progress} compact />
        </div>
      </details>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
        <div className="h-full rounded-full bg-accent-blue transition-[width]" style={{ width: `${((n - 1) / total) * 100}%` }} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <Plate
          image={image}
          marks={marks}
          zoomTo={q.type === "aanwijzen" ? undefined : q.markerId}
          onMarkerClick={q.type === "aanwijzen" && !checked ? (id) => setChoice(id) : undefined}
        />

        <div className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-ink">{image.title}</p>
          <h2 className="mt-2 text-lg font-semibold text-navy">
            {q.type === "aanwijzen" ? (
              <>
                Wijs aan: <span className="text-blue">{target.name}</span>
              </>
            ) : (
              PROMPT[q.type]
            )}
          </h2>
          {q.type === "aanwijzen" && !checked ? <p className="mt-1 text-sm text-muted-ink">Tik op het juiste punt op de plaat.</p> : null}

          {q.type === "benoem" ? (
            <ul className="mt-4 space-y-2">
              {q.options.map((id) => {
                const s = byId.get(id)!;
                const isRight = checked && id === q.structureId;
                const isWrong = checked && id === choice && id !== q.structureId;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={!!checked}
                      onClick={() => setChoice(id)}
                      className={cn(
                        "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                        !checked && choice === id && "border-blue bg-sky text-navy",
                        !checked && choice !== id && "border-line bg-white text-navy hover:border-blue/50",
                        isRight && "border-success bg-success-soft text-success-ink",
                        isWrong && "border-danger bg-danger-soft text-danger",
                        checked && !isRight && !isWrong && "border-line text-muted-ink",
                      )}
                    >
                      {s.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {q.type === "typ" ? (
            <input
              type="text"
              value={typed}
              disabled={!!checked}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confidence && check()}
              placeholder="Bijv. a. splenica"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                "mt-4 h-11 w-full rounded-lg border px-3 text-base outline-none focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/20",
                checked ? (checked.correct ? "border-success bg-success-soft" : "border-danger bg-danger-soft") : "border-line",
              )}
            />
          ) : null}

          {!checked ? (
            <>
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold text-navy">Hoe zeker ben je?</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["zeker", "twijfel", "gok"] as Confidence[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={confidence === c}
                      onClick={() => setConfidence(c)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm font-medium capitalize transition-colors",
                        confidence === c ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-navy/40",
                      )}
                    >
                      {c === "gok" ? "Gok" : c === "zeker" ? "Zeker" : "Twijfel"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Button type="button" className="mt-5 h-11 w-full font-semibold" disabled={!answered || !confidence} onClick={check}>
                Controleer
              </Button>
            </>
          ) : (
            <div className="mt-5">
              <p className={cn("flex items-center gap-2 font-semibold", checked.correct ? "text-success-ink" : "text-danger")}>
                {checked.correct ? <Check className="size-5" aria-hidden="true" /> : <X className="size-5" aria-hidden="true" />}
                {checked.correct ? (confidence === "zeker" ? "Goed!" : "Goed, maar je twijfelde: deze komt eerder terug.") : "Helaas, niet goed."}
              </p>
              <div className="mt-3 rounded-lg bg-canvas p-4">
                <p className="font-semibold text-navy">{target.name}</p>
                <p className="text-sm text-muted-ink">
                  {target.dutchName ? `${target.dutchName} · ` : ""}
                  {target.level === "toepassen" ? "Toepassen" : "Basis"}
                </p>
                {!checked.correct || confidence !== "zeker" ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-navy">{target.explanation}</p>
                    {target.clinical ? (
                      <p className="mt-2 text-sm leading-relaxed text-navy">
                        <span className="font-semibold">Klinisch: </span>
                        {target.clinical}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-navy">{target.summary}</p>
                )}
              </div>
              {picked ? (
                <p className="mt-3 text-sm text-muted-ink">
                  <span className="font-semibold text-navy">Jij koos {picked.name}:</span> {picked.summary}
                </p>
              ) : null}
              {q.type === "typ" && !checked.correct ? (
                <p className="mt-3 text-sm text-muted-ink">
                  Jij typte <span className="font-semibold text-navy">{typed}</span>. Ook goed gerekend: {target.synonyms.slice(0, 3).join(", ") || target.name}.
                </p>
              ) : null}
              <Button
                ref={next}
                type="button"
                className="mt-5 h-11 w-full font-semibold"
                onClick={() => onDone({ structureId: q.structureId, correct: checked.correct, confidence: confidence! })}
              >
                Volgende
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- plate browser (study) ----------
function PlateBrowser({ images, byId, initial, onBack }: { images: AnatomyImage[]; byId: Map<string, AnatomyStructure>; initial?: string; onBack: () => void }) {
  const [id, setId] = useState(initial ?? images[0]?.id);
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const index = Math.max(0, images.findIndex((i) => i.id === id));
  const image = images[index];
  const go = (i: number) => {
    const next = images[(i + images.length) % images.length];
    setId(next.id);
    setOpen(null);
  };
  // Keep the chosen thumbnail in view in the strip.
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>(`[data-plate="${image.id}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [image.id]);
  const openMarker = image.markers.find((m) => m.id === open);
  const openStructure = openMarker?.structureId ? byId.get(openMarker.structureId) : null;
  const numbers = numbering(image);
  const listed = image.markers.filter((m) => m.structureId).sort((a, b) => numbers.get(a.id)! - numbers.get(b.id)!);
  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Terug naar het overzicht
      </button>

      {/* All plates as a scrollable strip of thumbnails: you see what is on a plate before you open it. */}
      <div ref={stripRef} role="list" aria-label="Platen" className="-mx-4 mb-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {images.map((img, i) => {
          const active = img.id === image.id;
          return (
            <button
              key={img.id}
              type="button"
              role="listitem"
              data-plate={img.id}
              aria-current={active ? "true" : undefined}
              onClick={() => go(i)}
              className={cn(
                "group w-32 shrink-0 snap-start overflow-hidden rounded-lg border bg-white text-left transition-shadow sm:w-36",
                active ? "border-blue ring-2 ring-blue/30" : "border-line hover:border-[#c3d3e6] hover:shadow-[var(--shadow-card)]",
              )}
            >
              <span className="relative block aspect-[4/3] border-b border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" loading="lazy" className="absolute inset-0 size-full object-contain p-1.5" />
                <span className={cn("absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums", active ? "bg-blue text-white" : "bg-navy/80 text-white")}>{i + 1}</span>
              </span>
              <span className="block px-2 py-1.5">
                <span className={cn("line-clamp-2 text-xs leading-snug", active ? "font-semibold text-blue" : "text-navy")}>{img.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-ink tabular-nums">Plaat {index + 1} van {images.length}</p>
          <h3 className="truncate font-semibold text-navy sm:whitespace-normal">{image.title}</h3>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Vorige plaat" onClick={() => go(index - 1)} className="border-line">
            <ArrowLeft aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="Volgende plaat" onClick={() => go(index + 1)} className="border-line">
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <Plate
          image={image}
          marks={(m) => (!m.structureId ? "dim" : m.id === open ? "picked" : "plain")}
          labels={showAll ? (m) => (m.structureId ? byId.get(m.structureId)?.name ?? null : null) : undefined}
          onMarkerClick={(mid) => setOpen(mid)}
        />
        <div className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6 lg:sticky lg:top-24">
          <Button type="button" variant="outline" className="h-10" onClick={() => setShowAll((x) => !x)}>
            {showAll ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            {showAll ? "Namen verbergen" : "Alle namen tonen"}
          </Button>
          {openStructure ? (
            <div className="mt-5">
              <p className="font-semibold text-navy">{openStructure.name}</p>
              <p className="text-sm text-muted-ink">
                {openStructure.dutchName ? `${openStructure.dutchName} · ` : ""}
                {openStructure.level === "toepassen" ? "Toepassen" : "Basis"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy">{openStructure.explanation}</p>
              {openStructure.clinical ? (
                <p className="mt-2 text-sm leading-relaxed text-navy">
                  <span className="font-semibold">Klinisch: </span>
                  {openStructure.clinical}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-ink">Tik op een genummerd punt om te zien welke structuur het is, met uitleg.</p>
          )}
          <ol className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
            {listed.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setOpen(m.id)} className={cn("text-left hover:underline", m.id === open ? "font-semibold text-blue" : "text-navy")}>
                  <span className="mr-2 inline-block w-5 tabular-nums text-muted-ink">{numbers.get(m.id)}</span>
                  {showAll || m.id === open ? byId.get(m.structureId!)?.name : "?"}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
