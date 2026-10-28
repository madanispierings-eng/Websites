import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { MobileNav, NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { container } from "@/lib/site";
import { getViewer } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <a href="#inhoud" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Naar de inhoud
      </a>
      <div className={cn(container, "flex h-16 items-center gap-6 lg:h-[4.5rem]")}>
        <Logo />
        <NavLinks className="hidden lg:flex" />
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="text-navy">
            <Link href="/vakken#zoeken" aria-label="Zoek een vak">
              <Search className="size-[1.15rem]" />
            </Link>
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            {viewer ? (
              <>
                <Button asChild variant="outline" className="h-10 border-navy/25 px-5 font-semibold text-navy">
                  <Link href={viewer.role === "admin" ? "/admin" : "/dashboard"}>
                    {viewer.role === "admin" ? "Beheer" : "Mijn dashboard"}
                  </Link>
                </Button>
                <form action={signOut}>
                  <Button type="submit" className="h-10 px-5 font-semibold">Uitloggen</Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="h-10 border-navy/25 px-5 font-semibold text-navy">
                  <Link href="/inloggen">Inloggen</Link>
                </Button>
                <Button asChild className="h-10 px-5 font-semibold">
                  <Link href="/registreren">Registreren</Link>
                </Button>
              </>
            )}
          </div>
          <MobileNav signedIn={Boolean(viewer)} isAdmin={viewer?.role === "admin"} />
        </div>
      </div>
    </header>
  );
}
