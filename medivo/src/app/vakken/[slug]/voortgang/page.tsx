import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Layers, ListChecks, RotateCcw } from "lucide-react";
import { AccessNotice } from "@/components/course/access-notice";
import { CourseSubheader } from "@/components/course/course-subheader";
import { rateText, rateTone } from "@/components/course/study-progress";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/lib/data/catalog";
import { getCourseProgress } from "@/lib/data/learning";
import { coverage, MIN_ANSWERED, pct, summarize, TOPIC_DONE } from "@/lib/progress/summary";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: `Mijn voortgang ${course.title}`, robots: { index: false, follow: false } } : {};
}

const nl = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 1 });
const date = (iso: string) => new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

export default async function ProgressPage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const progress = await getCourseProgress(course.id);
  const base = `/vakken/${course.slug}`;

  return (
    <main id="inhoud" className="flex-1">
      <CourseSubheader
        course={course}
        active="voortgang"
        title="Mijn studievoortgang"
        intro="Hoeveel van de stof je hebt doorgewerkt, en hoe goed het oefenen gaat. Die twee staan bewust los van elkaar."
      />
      <div className={cn(container, "py-8 lg:py-10")}>
        {!progress ? <AccessNotice signedIn={false} next={`${base}/voortgang`} /> : <Overview progress={progress} base={base} />}
      </div>
    </main>
  );
}

function Overview({ progress, base }: { progress: NonNullable<Awaited<ReturnType<typeof getCourseProgress>>>; base: string }) {
  const s = summarize(progress, base);
  const topics = progress.topics.filter((t) => coverage(t) !== null);
  const objectives = topics.reduce((a, t) => ({ done: a.done + t.objectivesDone, total: a.total + t.objectivesTotal }), { done: 0, total: 0 });
  const fc = s.flashcards;
  const exams = progress.exams;

  return (
    <div className="space-y-6">
      {s.advice ? (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-accent-blue/25 bg-sky px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-blue">Studieadvies</p>
            <p className="mt-1 text-navy">{s.advice.text}</p>
          </div>
          <Button asChild><Link href={s.advice.href}>{s.advice.label} <ArrowRight aria-hidden="true" /></Link></Button>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="stof-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 id="stof-titel" className="text-lg font-semibold text-navy">Doorgewerkte stof</h2>
          <p className="mt-0.5 text-sm text-muted-ink">Wat je al hebt gedaan, los van of het goed ging.</p>
          <p className="mt-4 text-4xl font-bold tabular-nums text-navy">{pct(s.coverage)}</p>
          <Bar value={s.coverage} tone="bg-accent-blue" label="Doorgewerkte stof" className="mt-3" />
          <ul className="mt-5 space-y-3 text-sm">
            <Row label="Oefenvragen gemaakt" done={s.questionsAnswered} total={s.questionsTotal} />
            <Row label="Flashcards beheerst" done={fc.mastered} total={fc.total} />
            <Row label="Leerdoelen afgevinkt" done={objectives.done} total={objectives.total} />
            <li className="flex justify-between gap-3 border-t border-line pt-3 text-navy">
              <span>Onderwerpen afgerond (≥ {pct(TOPIC_DONE)} doorgewerkt)</span>
              <span className="font-semibold tabular-nums">{s.topicsDone} van {s.topicsWithContent}</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="prestatie-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 id="prestatie-titel" className="text-lg font-semibold text-navy">Oefenprestaties</h2>
          <p className="mt-0.5 text-sm text-muted-ink">Je laatste antwoord per vraag; alleen in één keer goed telt als goed.</p>
          <p className={cn("mt-4 text-4xl font-bold tabular-nums", s.correctRate === null ? "text-muted-ink" : rateText(s.correctRate))}>
            {s.correctRate === null ? "–" : pct(s.correctRate)}
          </p>
          {s.correctRate !== null ? <Bar value={s.correctRate} tone={rateTone(s.correctRate)} label="Goed beantwoord" className="mt-3" /> : null}
          <ul className="mt-5 space-y-3 text-sm text-navy">
            <li className="flex justify-between gap-3"><span>In één keer goed</span><span className="font-semibold tabular-nums">{s.questionsCorrect} van {s.questionsAnswered}</span></li>
            <li className="flex justify-between gap-3"><span>Antwoorden gegeven (alle sessies)</span><span className="font-semibold tabular-nums">{progress.answersGiven}</span></li>
            <li className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <span>Nog te herhalen (fout of met hint)</span>
              <span className="flex items-center gap-3">
                <span className="font-semibold tabular-nums">{progress.toRepeat}</span>
                {progress.toRepeat ? (
                  <Button asChild size="sm" variant="outline" className="border-line text-navy">
                    <Link href={`${base}/oefenen?modus=incorrect`}><RotateCcw aria-hidden="true" /> Herhaal je fouten</Link>
                  </Button>
                ) : null}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section aria-labelledby="onderwerp-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 id="onderwerp-titel" className="text-lg font-semibold text-navy">Per onderwerp</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-xs font-semibold uppercase tracking-[0.04em] text-muted-ink">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">Onderwerp</th>
                <th scope="col" className="w-44 py-2 pr-4 font-semibold">Doorgewerkt</th>
                <th scope="col" className="w-44 py-2 pr-4 font-semibold">Goed in één keer</th>
                <th scope="col" className="w-28 py-2 pr-4 font-semibold">Flashcards</th>
                <th scope="col" className="py-2 font-semibold"><span className="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {topics.map((t, i) => {
                const c = coverage(t) ?? 0;
                const rate = t.questionsAnswered >= MIN_ANSWERED ? t.questionsCorrect / t.questionsAnswered : null;
                return (
                  <tr key={t.id} className="align-middle">
                    <th scope="row" className="py-3 pr-4 font-medium text-navy">
                      <span className="mr-2 tabular-nums text-muted-ink">{i + 1}</span>{t.title}
                    </th>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2">
                        <Bar value={c} tone={c >= TOPIC_DONE ? "bg-success" : "bg-accent-blue"} label={`Doorgewerkt ${t.title}`} className="flex-1" />
                        <span className="w-9 text-right tabular-nums text-navy">{pct(c)}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {rate === null ? (
                        <span className="text-muted-ink">{t.questionsAnswered ? `${t.questionsAnswered} gemaakt` : "Nog niet geoefend"}</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Bar value={rate} tone={rateTone(rate)} label={`Goed ${t.title}`} className="flex-1" />
                          <span className={cn("w-9 text-right font-semibold tabular-nums", rateText(rate))}>{pct(rate)}</span>
                        </span>
                      )}
                      {t.questionsAnswered ? <span className="mt-0.5 block text-xs text-muted-ink">{t.questionsCorrect} van {t.questionsAnswered} goed</span> : null}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-navy">{t.flashcardsTotal ? `${t.flashcardsMastered} / ${t.flashcardsTotal}` : "–"}</td>
                    <td className="py-3">
                      <span className="flex justify-end gap-1">
                        {t.questionsTotal ? (
                          <Link href={`${base}/oefenen?onderwerp=${t.id}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-blue hover:bg-sky">
                            <ListChecks className="size-4" aria-hidden="true" /> Oefenen
                          </Link>
                        ) : null}
                        {t.flashcardsTotal ? (
                          <Link href={`${base}/flashcards?onderwerp=${t.id}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-blue hover:bg-sky">
                            <Layers className="size-4" aria-hidden="true" /> Flashcards
                          </Link>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="fc-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 id="fc-titel" className="text-lg font-semibold text-navy">Flashcards</h2>
          <p className="mt-0.5 text-sm text-muted-ink">Beheerst = op twee verschillende dagen geweten.</p>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
            {[
              [fc.mastered, "bg-success"],
              [fc.learning, "bg-accent-blue"],
              [fc.again, "bg-[#e3a04f]"],
            ].map(([n, cls]) => (n ? <div key={cls as string} className={cn("h-full", cls as string)} style={{ width: `${((n as number) / Math.max(fc.total, 1)) * 100}%` }} /> : null))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-navy sm:grid-cols-4">
            {[
              ["Beheerst", fc.mastered, "bg-success"],
              ["Aan het leren", fc.learning, "bg-accent-blue"],
              ["Opnieuw", fc.again, "bg-[#e3a04f]"],
              ["Nieuw", fc.total - fc.mastered - fc.learning - fc.again, "bg-line"],
            ].map(([label, n, cls]) => (
              <li key={label as string}>
                <span className="flex items-center gap-2 text-muted-ink"><span className={cn("size-2.5 rounded-full", cls as string)} aria-hidden="true" />{label}</span>
                <span className="mt-0.5 block text-xl font-bold tabular-nums">{n as number}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-navy">
            <span>{fc.due} {fc.due === 1 ? "kaart is" : "kaarten zijn"} klaar om te herhalen (inclusief nieuwe)</span>
            {fc.total ? <Button asChild size="sm"><Link href={`${base}/flashcards`}>Naar flashcards</Link></Button> : null}
          </div>
        </section>

        <section aria-labelledby="tentamen-titel" className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 id="tentamen-titel" className="text-lg font-semibold text-navy">Proeftentamens</h2>
          <p className="mt-0.5 text-sm text-muted-ink">Je laatste {exams.length > 1 ? exams.length : ""} ingeleverde tentamens in tentamenmodus.</p>
          {exams.length ? (
            <ol className="mt-4 space-y-3">
              {exams.map((e, i) => {
                const r = e.points ? e.scored / e.points : 0;
                const prev = exams[i + 1];
                const diff = prev && prev.points ? r - prev.scored / prev.points : null;
                return (
                  <li key={e.id}>
                    <span className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-navy">
                        <span className="font-medium">{e.examTitle ?? `${e.questions} vragen`}</span>
                        <span className="text-muted-ink"> · {date(e.finishedAt)}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {diff !== null && Math.abs(diff) >= 0.005 ? (
                          <span className={cn("mr-2 text-xs font-medium", diff > 0 ? "text-success-ink" : "text-danger")}>
                            {diff > 0 ? "+" : "−"}{pct(Math.abs(diff))}
                          </span>
                        ) : null}
                        <span className={cn("font-semibold", rateText(r))}>{pct(r)}</span>
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-3">
                      <Bar value={r} tone={rateTone(r)} label={`Score ${date(e.finishedAt)}`} className="flex-1" />
                      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-ink">{nl(e.scored)} / {nl(e.points)} pt</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-ink">Je hebt nog geen tentamen in tentamenmodus ingeleverd.</p>
          )}
          <Button asChild variant="outline" size="sm" className="mt-5 border-line text-navy">
            <Link href={`${base}/oefenen?modus=exam`}>Tentamen simuleren</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}

function Row({ label, done, total }: { label: string; done: number; total: number }) {
  if (!total) return null;
  return (
    <li>
      <span className="flex justify-between gap-3 text-navy">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{done} van {total}</span>
      </span>
      <Bar value={done / total} tone="bg-accent-blue/70" label={label} className="mt-1.5" />
    </li>
  );
}

function Bar({ value, tone, label, className }: { value: number; tone: string; label: string; className?: string }) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("block h-1.5 overflow-hidden rounded-full bg-canvas", className)}
    >
      <span className={cn("block h-full rounded-full", tone)} style={{ width: pct(Math.min(value, 1)) }} />
    </span>
  );
}
