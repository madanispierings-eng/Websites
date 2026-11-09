import { Check, ClipboardList, Clock, Layers, Play, Sparkles, Target, TrendingUp, Video } from "lucide-react";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * "Alles wat je per vak krijgt": six feature cards, each with a small on-brand schematic preview
 * (pure CSS/SVG, theme-aware, no external assets) so the section reads as a polished product tour.
 */

const bar = "rounded-full bg-navy/15";
const barSoft = "rounded-full bg-navy/10";

/** Interactive summary: question lines, an input, and a revealed model answer. */
function SummaryPreview() {
  return (
    <div className="w-full max-w-[14rem] rounded-xl border border-line bg-white p-3.5 shadow-sm">
      <div className={cn("h-2 w-4/5", bar)} />
      <div className={cn("mt-1.5 h-2 w-1/2", barSoft)} />
      <div className="mt-2.5 h-6 rounded-md border border-input bg-canvas" />
      <div className="mt-2.5 flex items-start gap-2 rounded-md border border-success/30 bg-success-soft/50 p-2">
        <Check className="mt-0.5 size-3.5 shrink-0 rounded-full bg-success p-0.5 text-white" strokeWidth={3} aria-hidden="true" />
        <div className="flex-1 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-success/30" />
          <div className="h-1.5 w-2/3 rounded-full bg-success/25" />
        </div>
      </div>
    </div>
  );
}

/** Flashcards: a small stack of cards. */
function FlashcardsPreview() {
  return (
    <div className="relative h-28 w-44">
      <div className="absolute inset-x-5 top-4 h-20 rotate-[-7deg] rounded-xl border border-line bg-white shadow-sm" />
      <div className="absolute inset-x-2 top-2 h-20 rotate-[4deg] rounded-xl border border-line bg-white shadow-sm" />
      <div className="absolute inset-x-0 top-0 flex h-20 flex-col justify-center gap-2 rounded-xl border border-blue/25 bg-white px-4 shadow-sm">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-blue">Vraag</span>
        <div className={cn("h-2 w-5/6", bar)} />
        <div className={cn("h-2 w-1/2", barSoft)} />
      </div>
    </div>
  );
}

/** Learning objective with an explanation video. */
function VideoPreview() {
  return (
    <div className="w-full max-w-[14rem]">
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-lg bg-navy">
        <span className="absolute inset-0 bg-gradient-to-br from-blue/30 to-transparent" aria-hidden="true" />
        <span className="relative grid size-10 place-items-center rounded-full bg-white/95 text-navy shadow">
          <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="grid size-4 place-items-center rounded border border-success bg-success text-white">
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        </span>
        <div className={cn("h-2 w-2/3", bar)} />
      </div>
    </div>
  );
}

/** Practice: multiple-choice options, one correct. */
function PracticePreview() {
  const rows = [
    { w: "w-3/4", correct: false },
    { w: "w-2/3", correct: true },
    { w: "w-4/5", correct: false },
  ];
  return (
    <div className="w-full max-w-[14rem] space-y-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border px-3 py-2",
            r.correct ? "border-success/40 bg-success-soft/50" : "border-line bg-white",
          )}
        >
          {r.correct ? (
            <Check className="size-4 shrink-0 rounded-full bg-success p-0.5 text-white" strokeWidth={3} aria-hidden="true" />
          ) : (
            <span className="size-4 shrink-0 rounded-full border border-muted-ink/40" />
          )}
          <div className={cn("h-2 rounded-full", r.w, r.correct ? "bg-success/40" : "bg-navy/15")} />
        </div>
      ))}
    </div>
  );
}

/** Practice exam: a sheet with a timer. */
function ExamPreview() {
  return (
    <div className="relative w-full max-w-[12rem] rounded-xl border border-line bg-white p-4 shadow-sm">
      <span className="absolute -right-2 -top-2 flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[0.65rem] font-semibold text-navy shadow-sm">
        <Clock className="size-3 text-blue" aria-hidden="true" /> 60:00
      </span>
      <div className={cn("h-2 w-1/2", bar)} />
      <div className="mt-3 space-y-2">
        {["w-full", "w-11/12", "w-4/5"].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full border border-blue/40" />
            <div className={cn("h-1.5 rounded-full bg-navy/12", w)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Progress: a small bar chart with one weak spot highlighted. */
function ProgressPreview() {
  const bars = [60, 85, 40, 72, 95];
  return (
    <div className="w-full max-w-[13rem]">
      <div className="flex h-24 items-end gap-2.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-t-md", h <= 45 ? "bg-[#e3a04f]" : "bg-accent-blue")}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 h-px w-full bg-line" />
      <p className="mt-2 text-[0.7rem] font-medium text-[#8a4f0c]">Zwak punt gevonden</p>
    </div>
  );
}

const cards = [
  { icon: Sparkles, title: "Interactieve samenvattingen", body: "Lees de stof per onderwerp en test jezelf meteen: typ je antwoord op de controlevragen en vergelijk het met het modelantwoord.", preview: SummaryPreview },
  { icon: Layers, title: "Flashcards per onderwerp", body: "Stamp de kernbegrippen erin met flashcards die precies de belangrijke punten pakken.", preview: FlashcardsPreview },
  { icon: Video, title: "Leerdoelen met video's", body: "Elk leerdoel per vak uitgebreid uitgewerkt, met een passende uitlegvideo erbij.", preview: VideoPreview },
  { icon: Target, title: "Oefenen per onderwerp", body: "Veel oefenvragen in verschillende vormen, met uitleg bij elk antwoord.", preview: PracticePreview },
  { icon: ClipboardList, title: "Oefententamens", body: "Oefententamens op basis van oude tentamenvragen, zodat je weet wat je kunt verwachten.", preview: ExamPreview },
  { icon: TrendingUp, title: "Je voortgang & zwakke punten", body: "Je voortgang wordt per onderwerp bijgehouden, zodat je precies ziet waar je nog moet oefenen.", preview: ProgressPreview },
];

export function HomeFeatures() {
  return (
    <section className={cn(container, "py-16 lg:py-24")} aria-labelledby="ervaring-titel">
      <div className="max-w-2xl">
        <h2 id="ervaring-titel" className="text-3xl font-bold tracking-[-0.02em] text-navy sm:text-4xl">
          Alles wat je per vak krijgt
        </h2>
        <p className="mt-3 text-muted-ink">Van leren tot toetsen, op één plek en met dezelfde vaste indeling voor elk vak.</p>
      </div>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon: Icon, title, body, preview: Preview }) => (
          <li
            key={title}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <div className="grid h-44 place-items-center border-b border-line bg-gradient-to-br from-sky to-white p-5">
              <Preview />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-navy">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky text-blue">
                  <Icon className="size-[1.15rem]" strokeWidth={1.8} aria-hidden="true" />
                </span>
                {title}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-ink">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
