import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * "Alles wat je per vak krijgt" — an editorial bento of the actual study material: one large summary
 * preview, with smaller real-interface previews for leerdoelen, oefenvragen, oefententamens and
 * tentamenfocus. Previews are clean HTML/CSS mock-ups (no stock icons), styled like the real app.
 */

const SLUG = "mechanisms-of-disease-2";

function Line({ w, tone = "ink" }: { w: string; tone?: "ink" | "light" | "white" }) {
  return (
    <div
      className={cn(
        "h-2 rounded-full",
        w,
        tone === "white" ? "bg-white/25" : tone === "light" ? "bg-navy/10" : "bg-navy/15",
      )}
    />
  );
}

/* ---------- previews ---------- */

function SummaryPreview() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <p className="font-serif text-xl font-semibold text-navy">Hematologie en hemostase</p>
      <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-ink">Mechanisms of Disease 2</p>
      <div className="mt-4 h-px bg-line" />
      <p className="mt-4 text-sm font-semibold text-navy">3.4 De stollingscascade</p>
      <div className="mt-3 space-y-2">
        <Line w="w-full" /><Line w="w-11/12" tone="light" /><Line w="w-3/4" tone="light" />
      </div>
      <div className="mt-5 rounded-xl border border-[#e8c48a]/60 bg-[#fdf6ec] p-4">
        <p className="text-sm font-semibold text-[#8a4f0c]">Tentamenfocus</p>
        <div className="mt-2.5 space-y-2">
          {["w-11/12", "w-4/5"].map((w) => (
            <div key={w} className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-[#c98a3c]" />
              <div className={cn("h-1.5 rounded-full bg-[#c98a3c]/35", w)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ObjectivesPreview() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="font-serif text-base font-semibold text-navy">Leerdoelen</p>
      <ul className="mt-3 space-y-3">
        {["w-4/5", "w-11/12", "w-2/3"].map((w) => (
          <li key={w} className="flex items-center gap-3">
            <span className="grid size-5 shrink-0 place-items-center rounded-[0.3rem] border border-success bg-success">
              <svg viewBox="0 0 12 12" className="size-3 text-white" aria-hidden="true"><path d="M2 6.5 4.5 9 10 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <Line w={w} tone="light" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionPreview() {
  const rows = [
    { l: "A", w: "w-2/3", on: false },
    { l: "B", w: "w-3/4", on: true },
    { l: "C", w: "w-1/2", on: false },
    { l: "D", w: "w-2/3", on: false },
  ];
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold text-muted-ink">Vraag 4</p>
      <div className="mt-2 space-y-2">
        <Line w="w-full" tone="light" /><Line w="w-5/6" tone="light" />
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.l} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", r.on ? "border-accent-blue bg-sky/60" : "border-line")}>
            <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", r.on ? "border-accent-blue" : "border-muted-ink/40")}>
              {r.on ? <span className="size-2 rounded-full bg-accent-blue" /> : null}
            </span>
            <span className="text-xs font-semibold text-navy">{r.l}</span>
            <div className={cn("h-1.5 rounded-full", r.w, r.on ? "bg-accent-blue/40" : "bg-navy/12")} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamPreview() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 text-center shadow-[var(--shadow-card)]">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blue">Oefententamen</p>
      <p className="mt-2 font-serif text-lg font-semibold leading-tight text-navy">Mechanisms<br />of Disease 2</p>
      <div className="mx-auto mt-3 h-px w-12 bg-line" />
      <p className="mt-3 text-xs text-muted-ink">65 vragen · tentamenmodus</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white">Start tentamen</div>
    </div>
  );
}

function FocusPreview() {
  return (
    <div className="rounded-2xl border border-[#e8c48a]/60 bg-[#fdf6ec] p-5 shadow-[var(--shadow-card)]">
      <p className="font-serif text-base font-semibold text-[#8a4f0c]">Tentamenfocus</p>
      <ul className="mt-3 space-y-2.5">
        {["w-11/12", "w-3/4", "w-5/6"].map((w) => (
          <li key={w} className="flex items-center gap-2.5">
            <span className="size-1.5 shrink-0 rounded-full bg-[#c98a3c]" />
            <div className={cn("h-1.5 rounded-full bg-[#c98a3c]/35", w)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- a small card wrapper for the bottom row ---------- */
function MiniCard({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white p-7">
      <h3 className="font-serif text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-ink">{body}</p>
      <div className="mt-6 lg:translate-x-3">{children}</div>
    </article>
  );
}

export function HomeFeatures() {
  return (
    <section className={cn(container, "py-16 lg:py-24")} aria-labelledby="studie-titel">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-blue">Studiemateriaal</span>
        <span className="h-px w-10 bg-blue/40" aria-hidden="true" />
      </div>
      <h2 id="studie-titel" className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.01em] text-navy sm:text-5xl">
        Alles wat je per vak krijgt
      </h2>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-ink">
        Van leren tot toetsen, op één plek en met dezelfde vaste indeling voor elk vak.
      </p>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {/* Large: complete summaries */}
        <article className="relative overflow-hidden rounded-3xl bg-navy text-white lg:col-span-2">
          <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-6">
            <div>
              <h3 className="font-serif text-3xl font-semibold leading-tight sm:text-[2.1rem]">Complete samenvattingen</h3>
              <p className="mt-4 max-w-sm text-[1.02rem] leading-relaxed text-white/70">
                Duidelijke, gestructureerde samenvattingen van alle tentamenstof — met interactieve controlevragen en tentamenfocus per hoorcollege.
              </p>
              <Link
                href={`/vakken/${SLUG}/samenvatting`}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-white/90"
              >
                Bekijk voorbeeld <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="lg:translate-x-6 lg:translate-y-2">
              <SummaryPreview />
            </div>
          </div>
        </article>

        {/* Leerdoelen */}
        <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white p-8">
          <h3 className="font-serif text-2xl font-semibold text-navy">Leerdoelen</h3>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-ink">
            Alle leerdoelen per vak uitgewerkt, met uitlegvideo&rsquo;s en toelichting op de belangrijkste concepten.
          </p>
          <div className="mt-6 lg:translate-x-3">
            <ObjectivesPreview />
          </div>
        </article>

        {/* Bottom row */}
        <MiniCard title="Oefenvragen" body="Gerichte oefenvragen per onderwerp, in verschillende vormen en met uitgebreide uitleg.">
          <QuestionPreview />
        </MiniCard>
        <MiniCard title="Oefententamens" body="Volledige oefententamens op basis van oude tentamenvragen, zodat je optimaal kunt oefenen.">
          <ExamPreview />
        </MiniCard>
        <MiniCard title="Tentamenfocus" body="De belangrijkste onderwerpen, valkuilen en tentamentips, per hoorcollege uitgelicht.">
          <FocusPreview />
        </MiniCard>
      </div>
    </section>
  );
}
