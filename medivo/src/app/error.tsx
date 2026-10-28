"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="inhoud" className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">Er ging iets mis</h1>
        <p className="mt-3 text-muted-ink">Probeer het opnieuw. Blijft het misgaan, kom dan later terug.</p>
        <Button onClick={reset} className="mt-8 h-11 px-6">Opnieuw proberen</Button>
      </div>
    </main>
  );
}
