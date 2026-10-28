"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hoofdmenu" className={className}>
      <ul className="flex items-center gap-1">
        {site.nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-[0.9rem] font-medium text-navy/80 transition-colors hover:bg-sky hover:text-navy",
                  active && "bg-sky text-navy",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-navy lg:hidden" aria-label="Menu openen">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(22rem,88vw)] gap-0 p-0">
        <SheetHeader className="border-b border-line p-5">
          <SheetTitle className="flex items-center gap-2 text-navy">
            <LogoMark className="h-6 w-7" /> Medivo
          </SheetTitle>
          <SheetDescription className="sr-only">Navigatie</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobiel menu" className="flex flex-col p-3">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-3 text-base font-medium text-navy",
                isActive(pathname, item.href) && "bg-sky",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 border-t border-line p-5">
          {signedIn ? (
            <Button asChild className="h-11" onClick={() => setOpen(false)}>
              <Link href={isAdmin ? "/admin" : "/dashboard"}>{isAdmin ? "Beheer" : "Mijn dashboard"}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="h-11" onClick={() => setOpen(false)}>
                <Link href="/inloggen">Inloggen</Link>
              </Button>
              <Button asChild className="h-11" onClick={() => setOpen(false)}>
                <Link href="/registreren">Registreren</Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
