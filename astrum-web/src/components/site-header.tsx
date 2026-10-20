"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookingButton } from "@/components/booking";
import { nav, services } from "@/lib/site";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href);

export function SiteHeader() {
  const pathname = usePathname();
  // On the home page the hero carries its own links; the bar waits below it and comes back on the way up.
  const home = pathname === "/";
  const headerRef = React.useRef<HTMLElement>(null);

  // Step aside while reading down, come back on the way up.
  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const hero = home ? (document.querySelector<HTMLElement>("[data-hero]")?.offsetHeight ?? 0) : 0;
      const away = y > last && y > 240;
      el.dataset.hidden = String((home && y < hero) || (away && !el.contains(document.activeElement)));
      last = y;
    };
    const onFocus = () => (el.dataset.hidden = "false");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocus);
    };
  }, [home]);
  const inServices = services.some((s) => isActive(pathname, s.href));

  return (
    <header
      ref={headerRef}
      data-hidden={home || undefined}
      className={cn(
        "top-0 z-40 bg-background text-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[hidden=true]:-translate-y-full",
        home ? "dark fixed inset-x-0" : "sticky",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link href="/" className="font-display text-[1.75rem] leading-none tracking-[0.18em] uppercase" aria-label="Astrum, naar de homepage" translate="no">
          Astrum
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "h-11 bg-transparent px-3 text-small font-normal hover:bg-secondary data-[state=open]:bg-secondary",
                    inServices && "text-gold-deep",
                  )}
                >
                  Diensten
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-popover">
                  <ul className="grid w-[420px] gap-1 p-2">
                    {services.map((s) => (
                      <li key={s.href}>
                        {/* Classes on NavigationMenuLink so they merge with its flex row instead of fighting it. */}
                        <NavigationMenuLink asChild className="block p-3 hover:bg-secondary focus:bg-secondary">
                          <Link
                            href={s.href}
                            aria-current={isActive(pathname, s.href) ? "page" : undefined}
                          >
                            <span className="block text-body font-medium">{s.name}</span>
                            <span className="mt-1 block text-small text-muted-foreground">{s.line}</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {nav.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                      className="inline-flex h-11 items-center px-3 text-small hover:bg-secondary aria-[current=page]:text-gold-deep"
                    >
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <BookingButton className="ml-3" />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <BookingButton className="h-11 px-4 text-small">Gesprek</BookingButton>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

/** The phone menu: one word that opens a full-screen panel. Used by the bar and by the home hero. */
export function MobileMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn("inline-flex h-11 items-center px-3 text-small font-medium hover:bg-secondary", className)}>
        Menu
      </SheetTrigger>
      <SheetContent data-lenis-prevent side="right" className="gap-0 overflow-y-auto overscroll-contain border-0 bg-background p-0 text-foreground data-[side=right]:w-full data-[side=right]:border-l-0 data-[side=right]:sm:max-w-md">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav aria-label="Menu" className="mt-20 grid gap-1 px-6 pb-10">
          {[{ href: "/", label: "Home" }, ...services.map((s) => ({ href: s.href, label: s.name })), ...nav, { href: "/vragen/", label: "Vragen" }].map(
            (item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="py-1 text-head aria-[current=page]:text-gold-deep"
                >
                  {item.label}
                </Link>
              </SheetClose>
            ),
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
