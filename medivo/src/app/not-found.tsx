import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="inhoud" className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div>
        <p className="text-sm font-semibold text-blue">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-navy">Deze pagina bestaat niet</h1>
        <p className="mt-3 text-muted-ink">Misschien is de link verouderd. Je vindt alle vakken in het overzicht.</p>
        <Button asChild className="mt-8 h-11 px-6"><Link href="/vakken">Naar alle vakken</Link></Button>
      </div>
    </main>
  );
}
