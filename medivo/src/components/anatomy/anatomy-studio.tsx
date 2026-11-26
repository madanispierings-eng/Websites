"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Images, Maximize2, Minimize2, RotateCcw, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnatomyImage, AnatomyProgress, AnatomyStructure } from "@/lib/data/anatomy";
import { cn } from "@/lib/utils";
import { reviewAnatomy } from "@/app/vakken/[slug]/anatomie/actions";

type Confidence = "zeker" | "twijfel" | "gok";
type QType = "benoem" | "aanwijzen" | "typ";
type Question = { key: string; structureId: string; imageId: string; markerId: string; type: QType; options: string[] };
type Outcome = { structureId: string; correct: boolean; confidence: Confidence };

const SESSION_SIZE = 15;

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

export function AnatomyStudio({
  structures,
  images,
  initialProgress,
}: {
  structures: AnatomyStructure[];
  images: AnatomyImage[];
  initialProgress: Record<string, AnatomyProgress>;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [view, setView] = useState<{ kind: "start" } | { kind: "oefenen"; ids: string[] } | { kind: "platen"; imageId?: string }>({ kind: "start" });
  const byId = useMemo(() => new Map(structures.map((s) => [s.id, s])), [structures]);
  // Only structures that appear on a plate can be asked.
  const onPlate = useMemo(() => {
    const set = new Set<string>();
    for (const i of images) for (const m of i.markers) if (m.structureId) set.add(m.structureId);
    return structures.filter((s) => set.has(s.id));
  }, [structures, images]);
  const regions = useMemo(() => [...new Map(onPlate.map((s) => [s.region, s.regionSort])).entries()].sort((a, b) => a[1] - b[1]).map(([r]) => r), [onPlate]);

  const record = (o: Outcome) => {
    setProgress((p) => {
      const cur = p[o.structureId];
      const box = !o.correct ? 0 : o.confidence === "zeker" ? Math.min((cur?.box ?? 0) + 1, 5) : cur?.box ?? 0;
      return { ...p, [o.structureId]: { box, reviews: (cur?.reviews ?? 0) + 1, lastCorrect: o.correct, lastConfidence: o.confidence, dueAt: new Date().toISOString() } };
    });
    void reviewAnatomy(o);
  };

  if (view.kind === "oefenen")
    return (
      <Session
        key={view.ids.join()}
        ids={view.ids}
        byId={byId}
        images={images}
        onRecord={record}
        onExit={() => setView({ kind: "start" })}
        onAgain={(ids) => setView({ kind: "oefenen", ids })}
      />
    );
  if (view.kind === "platen")
    return <PlateBrowser images={images} byId={byId} initial={view.imageId} onBack={() => setView({ kind: "start" })} />;

  return (
    <Start
      regions={regions}
      structures={onPlate}
      images={images}
      progress={progress}
      onStart={(ids) => setView({ kind: "oefenen", ids })}
      onPlates={(imageId) => setView({ kind: "platen", imageId })}
    />
  );
}

// ---------- start screen ----------
function Start({
  regions,
  structures,
  images,
  progress,
  onStart,
  onPlates,
}: {
  regions: string[];
  structures: AnatomyStructure[];
  images: AnatomyImage[];
  progress: Record<string, AnatomyProgress>;
  onStart: (ids: string[]) => void;
  onPlates: (imageId?: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const pool = structures.filter((s) => !selected.length || selected.includes(s.region));
  const now = Date.now();
  const toRepeat = structures.filter((s) => statusOf(progress[s.id]) === "aandacht");
  const counts = (list: AnatomyStructure[]) => {
    const c = { nieuw: 0, aandacht: 0, bezig: 0, beheerst: 0 };
    for (const s of list) c[statusOf(progress[s.id])]++;
    return c;
  };
  const total = counts(structures);

  // Session order: wrong first, then due, then new, then the rest; shuffled within each group.
  const startSession = () => {
    const rank = (s: AnatomyStructure) => {
      const p = progress[s.id];
      if (p && !p.lastCorrect) return 0;
      if (p && new Date(p.dueAt).getTime() <= now) return 1;
      if (!p) return 2;
      return 3 + p.box;
    };
    const groups = new Map<number, AnatomyStructure[]>();
    for (const s of pool) groups.set(rank(s), [...(groups.get(rank(s)) ?? []), s]);
    const ordered = [...groups.keys()].sort((a, b) => a - b).flatMap((k) => shuffle(groups.get(k)!));
    onStart(ordered.slice(0, SESSION_SIZE).map((s) => s.id));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <section className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-semibold text-navy">Oefenen</h2>
        <p className="mt-1 text-sm text-muted-ink">
          Benoem en wijs structuren aan op echte anatomische platen. Geef bij elk antwoord aan hoe zeker je bent: wat je fout had of
          gokte, komt eerder terug.
        </p>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-navy">Kies regio&apos;s</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip active={!selected.length} onClick={() => setSelected([])}>Alles</Chip>
            {regions.map((r) => (
              <Chip key={r} active={selected.includes(r)} onClick={() => setSelected((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]))}>
                {r}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" className="h-11 px-5 font-semibold" onClick={startSession} disabled={!pool.length}>
            <Target className="size-4" aria-hidden="true" />
            Start oefensessie ({Math.min(SESSION_SIZE, pool.length)} vragen)
          </Button>
          {toRepeat.length ? (
            <Button type="button" variant="outline" className="h-11 px-5" onClick={() => onStart(shuffle(toRepeat).slice(0, SESSION_SIZE).map((s) => s.id))}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Herhaal wat je fout had ({toRepeat.length})
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="h-11 px-5" onClick={() => onPlates()}>
            <Images className="size-4" aria-hidden="true" />
            Platen bekijken
          </Button>
        </div>
      </section>

      <aside className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-semibold text-navy">Jouw niveau</h2>
        <p className="mt-0.5 text-sm text-muted-ink">
          {total.beheerst} van {structures.length} structuren beheerst
        </p>
        <ul className="mt-4 space-y-3.5">
          {regions.map((r) => {
            const list = structures.filter((s) => s.region === r);
            const c = counts(list);
            const pct = (n: number) => `${(n / list.length) * 100}%`;
            return (
              <li key={r}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-navy">{r}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-ink">
                    {c.beheerst}/{list.length}
                    {c.aandacht ? <span className="ml-1.5 font-semibold text-danger">· {c.aandacht} fout</span> : null}
                  </span>
                </div>
                <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                  <span className="bg-success" style={{ width: pct(c.beheerst) }} />
                  <span className="bg-accent-blue/60" style={{ width: pct(c.bezig) }} />
                  <span className="bg-danger/70" style={{ width: pct(c.aandacht) }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-ink">
          <Legend className="bg-success">Beheerst</Legend>
          <Legend className="bg-accent-blue/60">Mee bezig</Legend>
          <Legend className="bg-danger/70">Fout</Legend>
        </p>
        <h3 className="mt-6 text-sm font-semibold text-navy">Platen</h3>
        <ul className="mt-2 space-y-1">
          {images.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => onPlates(i.id)} className="text-left text-sm text-blue hover:underline">
                {i.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-blue bg-blue text-white" : "border-line bg-white text-navy hover:border-blue/50",
      )}
    >
      {children}
    </button>
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
        <div
          className="relative mx-auto [--ph:56svh] lg:[--ph:calc(100vh-13rem)]"
          style={{ width: zoom ? "200%" : `min(100%, calc(var(--ph) * ${image.width / image.height}))` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.title} width={image.width} height={image.height} className="block h-auto w-full select-none" draggable={false} />
          {/* The printed leader lines are too thin to follow: draw a clear line from each number to the structure. */}
          <svg
            viewBox={`0 0 ${image.width} ${image.height}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full"
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
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
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
  const type: QType = prefer ?? (others.length < 3 ? pick<QType>(["benoem", "typ"]) : pick<QType>(["benoem", "benoem", "aanwijzen", "aanwijzen", "typ"]));
  const target = byId.get(structureId)!;
  // Distractors: other structures on the same plate, preferring the same region; then the same region elsewhere.
  const same = shuffle(others).sort((a, b) => Number(byId.get(b)?.region === target.region) - Number(byId.get(a)?.region === target.region));
  const extra = shuffle([...byId.values()].filter((s) => s.region === target.region && s.id !== structureId && !same.includes(s.id)).map((s) => s.id));
  const options = shuffle([structureId, ...[...same, ...extra].slice(0, 3)]);
  return { key: `${structureId}-${Math.random()}`, structureId, imageId: img.id, markerId: m.id, type, options };
}

function Session({
  ids,
  byId,
  images,
  onRecord,
  onExit,
  onAgain,
}: {
  ids: string[];
  byId: Map<string, AnatomyStructure>;
  images: AnatomyImage[];
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
  onExit,
  onDone,
}: {
  q: Question;
  n: number;
  total: number;
  byId: Map<string, AnatomyStructure>;
  image: AnatomyImage;
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
  const image = images.find((i) => i.id === id) ?? images[0];
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
      <div className="mb-4 flex flex-wrap gap-2">
        {images.map((i) => (
          <Chip key={i.id} active={i.id === image.id} onClick={() => { setId(i.id); setOpen(null); }}>
            {i.title}
          </Chip>
        ))}
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
