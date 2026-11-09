import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricing } from "@/lib/site";

/** Shown when content exists but the viewer has no entitlement (or is signed out): a professional paywall. */
export function AccessNotice({ signedIn, next }: { signedIn: boolean; next: string }) {
  const subHref = signedIn ? "/dashboard" : "/registreren";
  const perks = [
    "Alle vakken van je studiejaar",
    "Samenvattingen, flashcards, oefenvragen en oude tentamens",
    "Leerdoelen met uitlegvideo's en je voortgang bijgehouden",
  ];
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-line bg-sky/60 px-6 py-8 text-center sm:px-10">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-blue shadow-[var(--shadow-card)]">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-navy">Deze inhoud zit achter een abonnement</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-ink">
          Kies een jaarabonnement voor je hele studiejaar, of koop dit vak los.
        </p>
      </div>

      <div className="space-y-4 p-6 sm:p-8">
        {/* Year subscription — recommended */}
        <div className="relative rounded-xl border-2 border-accent-blue bg-white p-5">
          <span className="absolute -top-2.5 left-5 rounded-full bg-accent-blue px-2.5 py-0.5 text-xs font-semibold text-white">Voordeligst</span>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-semibold text-navy">Jaarabonnement</h3>
            <p className="text-navy"><span className="text-2xl font-bold">{pricing.monthly}</span> <span className="text-sm text-muted-ink">{pricing.per}</span></p>
          </div>
          <p className="mt-0.5 text-sm font-semibold text-success-ink">{pricing.trialLong} · {pricing.terms}</p>
          <p className="mt-0.5 text-sm text-muted-ink">Of {pricing.yearOnce} ineens voor het hele jaar.</p>
          <ul className="mt-3 space-y-1.5">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-navy/90">
                <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden="true" />{p}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-4 w-full font-semibold">
            <Link href={subHref}>{signedIn ? "Abonnement activeren" : "Start je gratis proefperiode"}</Link>
          </Button>
        </div>

        {/* Single course */}
        <div className="rounded-xl border border-line bg-canvas p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-semibold text-navy">Alleen dit vak</h3>
            <p className="text-navy"><span className="text-xl font-bold">{pricing.singleCourse}</span> <span className="text-sm text-muted-ink">{pricing.singleCourseTerms}</span></p>
          </div>
          <p className="mt-1 text-sm text-muted-ink">Het jaarabonnement is veel voordeliger als je meerdere vakken volgt.</p>
          <Button asChild variant="outline" className="mt-4 w-full font-semibold">
            <Link href={subHref}>Koop dit vak</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-ink">
          {pricing.availability}
          {!signedIn ? (
            <> · Al een account? <Link href={`/inloggen?volgende=${encodeURIComponent(next)}`} className="font-medium text-blue hover:underline">Inloggen</Link></>
          ) : null}
        </p>
      </div>
    </div>
  );
}
