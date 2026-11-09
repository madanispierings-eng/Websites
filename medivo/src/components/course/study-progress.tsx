import Link from "next/link";
import { ArrowRight, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResetTopicButton } from "@/app/vakken/[slug]/voortgang/reset-topic-button";
import { MIN_ANSWERED, pct, summarize, type CourseProgress } from "@/lib/progress/summary";
import { cn } from "@/lib/utils";

/** Color of a first-go score: red under 60%, amber under 75%, otherwise green. */
export const rateTone = (rate: number) => (rate < 0.6 ? "bg-danger" : rate < 0.75 ? "bg-[#e3a04f]" : "bg-success");
export const rateText = (rate: number) => (rate < 0.6 ? "text-danger" : rate < 0.75 ? "text-[#8a4f0c]" : "text-success-ink");

/** A short mastery label from the first-go score, matching the progress-bar colours. */
export function levelBadge(rate: number) {
  if (rate >= 0.85) return { label: "Beheerst", cls: "border-success/30 bg-success-soft text-success-ink" };
  if (rate >= 0.75) return { label: "Bijna beheerst", cls: "border-blue/20 bg-sky text-blue" };
  return { label: "Aandacht", cls: "border-[#e8c48a] bg-[#fdf6ec] text-[#8a4f0c]" };
}

/** The compact personal overview on the course page. Signed-out visitors see what it will show once they log in. */
export function StudyProgress({ progress, courseTitle, courseSlug, base }: { progress: CourseProgress | null; courseTitle: string; courseSlug: string; base: string }) {
  return (
    <aside aria-labelledby="voortgang-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 id="voortgang-titel" className="text-lg font-semibold text-navy">Mijn studievoortgang</h2>
      <p className="mt-0.5 text-sm text-muted-ink">Je persoonlijke voortgang in {courseTitle}</p>
      {progress ? <Signed progress={progress} base={base} courseSlug={courseSlug} /> : <SignedOut base={base} />}
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

function Signed({ progress, base, courseSlug }: { progress: CourseProgress; base: string; courseSlug: string }) {
  const s = summarize(progress, base);
  const practiceTopics = progress.topics.filter((t) => t.questionsTotal > 0);

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

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-navy">Niveau per thema</h3>
          <Link href={`${base}/voortgang`} className="text-xs font-medium text-blue hover:underline">Bekijk alles</Link>
        </div>
        {practiceTopics.length ? (
          <ul className="mt-3 space-y-3">
            {practiceTopics.map((t) => {
              const rate = t.questionsAnswered >= MIN_ANSWERED ? t.questionsCorrect / t.questionsAnswered : null;
              const badge = rate !== null ? levelBadge(rate) : null;
              return (
                <li key={t.id}>
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`${base}/oefenen?onderwerp=${t.id}`} className="min-w-0 truncate text-sm font-medium text-navy hover:text-blue">{t.title}</Link>
                    {badge ? (
                      <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold", badge.cls)}>{badge.label}</span>
                    ) : (
                      <span className="shrink-0 text-[0.7rem] font-medium text-muted-ink">Nog niet geoefend</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
                      <span className={cn("block h-full rounded-full", rate !== null ? rateTone(rate) : "bg-line")} style={{ width: rate !== null ? pct(rate) : "0%" }} />
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-ink">
                      {t.questionsAnswered ? <>{t.questionsCorrect}/{t.questionsAnswered} goed{rate !== null ? <span className={cn("ml-1 font-semibold", rateText(rate))}>· {pct(rate)}</span> : null}</> : <>0/{t.questionsTotal}</>}
                    </span>
                    {t.questionsAnswered ? <ResetTopicButton topicId={t.id} topicTitle={t.title} courseSlug={courseSlug} compact /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-ink">Zodra er oefenvragen klaarstaan, zie je hier je niveau per thema.</p>
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
