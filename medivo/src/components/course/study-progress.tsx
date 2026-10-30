import Link from "next/link";
import { ArrowRight, BookCheck, CircleHelp, Layers, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pct, summarize, type CourseProgress } from "@/lib/progress/summary";
import { cn } from "@/lib/utils";

const nl = (n: number) => n.toLocaleString("nl-NL");

/** Color of a first-go score: red under 60%, amber under 75%, otherwise green. */
export const rateTone = (rate: number) => (rate < 0.6 ? "bg-danger" : rate < 0.75 ? "bg-[#e3a04f]" : "bg-success");
export const rateText = (rate: number) => (rate < 0.6 ? "text-danger" : rate < 0.75 ? "text-[#8a4f0c]" : "text-success-ink");

/** The compact personal overview on the course page. Signed-out visitors see what it will show once they log in. */
export function StudyProgress({ progress, courseTitle, base }: { progress: CourseProgress | null; courseTitle: string; base: string }) {
  return (
    <aside aria-labelledby="voortgang-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 id="voortgang-titel" className="text-lg font-semibold text-navy">Mijn studievoortgang</h2>
      <p className="mt-0.5 text-sm text-muted-ink">Je persoonlijke voortgang in {courseTitle}</p>
      {progress ? <Signed progress={progress} base={base} /> : <SignedOut base={base} />}
    </aside>
  );
}

function SignedOut({ base }: { base: string }) {
  return (
    <div className="mt-5">
      <ul className="space-y-2.5 text-sm text-navy">
        {[
          "Hoeveel van de stof je al hebt doorgewerkt",
          "Je score op oefenvragen, per onderwerp",
          "Welke onderwerpen nog aandacht nodig hebben",
          "Hoeveel flashcards je beheerst",
        ].map((t) => (
          <li key={t} className="flex gap-2.5">
            <BookCheck className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild><Link href={`/inloggen?volgende=${encodeURIComponent(base)}`}>Log in om je voortgang te zien</Link></Button>
        <Button asChild variant="outline"><Link href="/registreren">Account maken</Link></Button>
      </div>
    </div>
  );
}

function Signed({ progress, base }: { progress: CourseProgress; base: string }) {
  const s = summarize(progress, base);
  const tiles = [
    { icon: CircleHelp, value: nl(s.questionsAnswered), label: "Vragen gemaakt", sub: s.questionsTotal ? `van ${nl(s.questionsTotal)}` : null },
    { icon: Target, value: s.correctRate === null ? "–" : pct(s.correctRate), label: "Goed beantwoord", sub: "in één keer" },
    { icon: Layers, value: nl(s.flashcards.mastered), label: "Flashcards beheerst", sub: s.flashcards.total ? `van ${nl(s.flashcards.total)}` : null },
    { icon: BookCheck, value: `${s.topicsDone}/${s.topicsWithContent}`, label: "Onderwerpen afgerond", sub: null },
  ];

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-navy">Doorgewerkte stof</p>
        <p className="text-2xl font-bold tabular-nums text-navy">{pct(s.coverage)}</p>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-sky"
        role="progressbar"
        aria-label="Doorgewerkte stof"
        aria-valuenow={Math.round(s.coverage * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-accent-blue" style={{ width: pct(s.coverage) }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-ink">Gemaakte vragen, beheerste flashcards en afgevinkte leerdoelen. Los van je score.</p>

      <ul className="mt-5 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <li key={t.label} className="rounded-lg border border-line px-3.5 py-3">
            <t.icon className="size-4 text-blue" aria-hidden="true" />
            <p className="mt-1.5 text-xl font-bold tabular-nums leading-none text-navy">
              {t.value}
              {t.sub ? <span className="ml-1 text-xs font-medium text-muted-ink">{t.sub}</span> : null}
            </p>
            <p className="mt-1 text-xs text-muted-ink">{t.label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-navy">Waar kun je nog verbeteren?</h3>
          {s.weak.length > 2 ? <Link href={`${base}/voortgang`} className="text-xs font-medium text-blue hover:underline">Bekijk alles</Link> : null}
        </div>
        {s.weak.length ? (
          <ul className="mt-3 space-y-3">
            {s.weak.slice(0, 3).map((t) => (
              <li key={t.id}>
                <Link href={`${base}/oefenen?onderwerp=${t.id}`} className="group block rounded-md outline-offset-4">
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-navy group-hover:text-blue">{t.title}</span>
                    <span className={cn("font-semibold tabular-nums", rateText(t.rate))}>{pct(t.rate)}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-3">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                      <span className={cn("block h-full rounded-full", rateTone(t.rate))} style={{ width: pct(t.rate) }} />
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-ink">{t.questionsCorrect} van {t.questionsAnswered} goed</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-ink">
            {s.questionsAnswered < 3
              ? "Maak een paar oefenvragen; dan zie je hier welke onderwerpen extra aandacht nodig hebben."
              : "Geen zwakke onderwerpen: overal minstens 75% in één keer goed."}
          </p>
        )}
      </div>

      {s.advice ? (
        <div className="mt-5 rounded-lg bg-sky px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-blue">Studieadvies</p>
          <p className="mt-1 text-sm text-navy">{s.advice.text}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-2">
        <Button asChild className="h-11 font-semibold">
          <Link href={s.advice?.href ?? `${base}/oefenen`}>
            {s.advice?.label ?? "Ga verder met oefenen"} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="text-blue">
          <Link href={`${base}/voortgang`}>Bekijk mijn voortgang</Link>
        </Button>
      </div>
    </div>
  );
}
