import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark, ChartColumn, CreditCard, History, LayoutGrid } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getDashboard } from "@/lib/data/dashboard";
import { container, yearLabel } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mijn dashboard", robots: { index: false, follow: false } };

const modeLabel: Record<string, string> = { topic: "Per onderwerp", mixed: "Gemengd", exam: "Tentamenmodus", incorrect: "Fout beantwoord" };
const date = (iso: string) => new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });

function Panel({ title, icon: Icon, children, className }: { title: string; icon: typeof History; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6", className)} aria-label={title}>
      <h2 className="flex items-center gap-2 font-semibold text-navy">
        <Icon className="size-[1.1rem] text-blue" aria-hidden="true" /> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/inloggen?volgende=/dashboard");
  const data = await getDashboard(viewer.user.id);
  if (!data) redirect("/inloggen");
  const accuracy = data.attempts.answered ? Math.round((data.attempts.correct / data.attempts.answered) * 100) : null;
  const firstName = data.profile.fullName?.split(" ")[0];

  return (
    <main id="inhoud" className={cn(container, "flex-1 py-10 lg:py-12")}>
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">{firstName ? `Welkom, ${firstName}` : "Mijn dashboard"}</h1>
      <p className="mt-2 text-muted-ink">Je voortgang, opgeslagen vragen en abonnement op één plek.</p>

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Beantwoorde vragen", value: data.attempts.answered.toLocaleString("nl-NL") },
          { label: "Juist beantwoord", value: data.attempts.correct.toLocaleString("nl-NL") },
          { label: "Score", value: accuracy === null ? "–" : `${accuracy}%` },
          { label: "Opgeslagen vragen", value: String(data.bookmarks.length) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
            <dt className="text-sm text-muted-ink">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-navy">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent bekeken vakken" icon={History}>
          {data.recent.length ? (
            <ul className="divide-y divide-line">
              {data.recent.map((c) => (
                <li key={c.slug}>
                  <Link href={`/vakken/${c.slug}`} className="flex items-center gap-3 py-3 text-sm hover:text-blue">
                    <span className="flex-1 font-medium text-navy">{c.title}</span>
                    <span className="text-xs text-muted-ink">{yearLabel(c.studyYear)}</span>
                    <ArrowRight className="size-4 text-navy/50" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nog geen vakken bekeken" className="py-8">
              <Link href="/vakken" className="font-medium text-blue hover:underline">Kies een vak</Link> om te beginnen.
            </EmptyState>
          )}
        </Panel>

        <Panel title="Oefensessies" icon={ChartColumn}>
          {data.sessions.length ? (
            <ul className="divide-y divide-line text-sm">
              {data.sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                  <span className="flex-1 font-medium text-navy">{s.courseTitle}</span>
                  <span className="text-muted-ink">{modeLabel[s.mode] ?? s.mode} · {s.total} vragen</span>
                  <span className="text-xs text-muted-ink">{date(s.startedAt)}{s.finished ? "" : " · niet afgerond"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nog geen oefensessies" className="py-8">Start een sessie vanuit een vak via &lsquo;Oefenen per onderwerp&rsquo;.</EmptyState>
          )}
        </Panel>

        <Panel title="Opgeslagen vragen" icon={Bookmark}>
          {data.bookmarks.length ? (
            <ul className="divide-y divide-line text-sm">
              {data.bookmarks.map((b) => (
                <li key={b.questionId} className="py-3">
                  <p className="line-clamp-2 text-navy">{b.stem}</p>
                  <Link href={`/vakken/${b.courseSlug}/oefenen`} className="mt-1 inline-block text-xs font-medium text-blue hover:underline">{b.courseTitle}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nog geen vragen gemarkeerd" className="py-8">Gebruik &lsquo;Markeer vraag&rsquo; tijdens het oefenen om een vraag te bewaren.</EmptyState>
          )}
        </Panel>

        <Panel title="Abonnement" icon={CreditCard}>
          {data.subscriptions.length ? (
            <ul className="divide-y divide-line text-sm">
              {data.subscriptions.map((s) => (
                <li key={s.id} className="py-3">
                  <p className="font-medium text-navy">{s.product ?? "Abonnement"}</p>
                  <p className="text-muted-ink">
                    Status: {s.status}
                    {s.currentPeriodEnd ? ` · ${s.cancelAtPeriodEnd ? "loopt af op" : "verlengt op"} ${date(s.currentPeriodEnd)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Geen actief abonnement" className="py-8">
              Je kunt de vakken bekijken en gratis inhoud gebruiken. <Link href="/vakken" className="font-medium text-blue hover:underline">Naar de vakken</Link>
            </EmptyState>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Mijn gegevens" icon={LayoutGrid}>
          <ProfileForm fullName={data.profile.fullName} studyYear={data.profile.studyYear} email={viewer.user.email ?? ""} />
        </Panel>
      </div>
    </main>
  );
}
