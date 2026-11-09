import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricing } from "@/lib/site";

/** Shown when content exists but the viewer has no entitlement (or is signed out): a professional paywall. */
export function AccessNotice({ signedIn, next }: { signedIn: boolean; next: string }) {
  const perks = [
    "Alle samenvattingen, flashcards en oefenvragen",
    "Leerdoelen met uitlegvideo's en oude tentamens",
    "Je voortgang per onderwerp bijgehouden",
  ];
  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-line bg-white text-center shadow-[var(--shadow-card)]">
      <div className="border-b border-line bg-sky/60 px-6 py-8 sm:px-10">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-blue shadow-[var(--shadow-card)]">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-navy">Deze inhoud zit achter een abonnement</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-ink">
          Met een Medivo-abonnement krijg je volledige toegang tot alle onderdelen van elk vak.
        </p>
      </div>
      <div className="px-6 py-7 sm:px-10">
        <p className="text-3xl font-bold tracking-[-0.01em] text-navy">
          {pricing.monthly} <span className="text-base font-medium text-muted-ink">{pricing.per}</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-success-ink">{pricing.trialLong} · daarna {pricing.terms}</p>
        <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-navy/90">
              <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2">
          {signedIn ? (
            <>
              <Button asChild size="lg" className="font-semibold"><Link href="/dashboard">Abonnement activeren</Link></Button>
              <p className="text-xs text-muted-ink">Je bent ingelogd. Activeer een abonnement om verder te gaan.</p>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="font-semibold"><Link href="/registreren">Start je gratis proefperiode</Link></Button>
              <p className="text-xs text-muted-ink">
                Al een account? <Link href={`/inloggen?volgende=${encodeURIComponent(next)}`} className="font-medium text-blue hover:underline">Inloggen</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
