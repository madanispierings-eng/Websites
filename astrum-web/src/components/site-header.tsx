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
  const [open, setOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);

  // Step aside while reading down, come back on the way up.
  React.useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const el = headerRef.current;
      if (!el) return;
      el.dataset.hidden = String(y > 240 && y > last && !el.contains(document.activeElement));
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const inServices = services.some((s) => isActive(pathname, s.href));

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-background text-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[hidden=true]:-translate-y-full">
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
                        <NavigationMenuLink asChild>
                          <Link
                            href={s.href}
                            aria-current={isActive(pathname, s.href) ? "page" : undefined}
                            className="block p-3 hover:bg-secondary focus:bg-secondary"
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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex h-11 items-center px-3 text-small font-medium hover:bg-secondary">
              Menu
            </SheetTrigger>
            <SheetContent data-lenis-prevent side="right" className="w-full gap-0 overflow-y-auto overscroll-contain border-0 bg-background p-0 text-foreground sm:max-w-md">
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
        </div>
      </div>
    </header>
  );
}
