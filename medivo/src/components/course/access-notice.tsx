import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when content exists but the viewer has no entitlement (or is signed out). */
export function AccessNotice({ signedIn, next }: { signedIn: boolean; next: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-6 text-center shadow-[var(--shadow-card)] sm:p-10">
      <Lock className="mx-auto size-8 text-blue" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold text-navy">
        {signedIn ? "Je hebt nog geen toegang tot dit vak" : "Log in om verder te gaan"}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-ink">
        {signedIn
          ? "Toegang tot deze inhoud hoort bij een abonnement of een losse aankoop voor dit vak."
          : "Met een account houd je je voortgang bij en zie je welke inhoud voor jou beschikbaar is."}
      </p>
      {!signedIn ? (
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link href={`/inloggen?volgende=${encodeURIComponent(next)}`}>Inloggen</Link></Button>
          <Button asChild><Link href="/registreren">Registreren</Link></Button>
        </div>
      ) : null}
    </div>
  );
}
