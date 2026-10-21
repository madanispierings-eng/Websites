"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { menu, nav, site } from "@/lib/content";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** Wordmark left; on desktop the main pages and the menu square on the right. Steps aside while reading down. */
export function SiteHeader() {
  const ref = React.useRef<HTMLElement>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      el.dataset.hidden = String(y > 120 && y > last && !el.contains(document.activeElement));
      el.dataset.scrolled = String(y > 8);
      last = y;
    };
    const onFocus = () => (el.dataset.hidden = "false");
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <header
      ref={ref}
      className="site-header fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-ground transition-transform duration-700 ease-out-expo data-[hidden=true]:-translate-y-full"
      data-header
    >
      <Link href="/" className="grid leading-none" aria-label="Astrum, naar het begin" translate="no">
        <span className="text-[1.375rem] font-medium tracking-[0.2em]">ASTRUM</span>
        <span className="mt-1 text-[0.8125rem] text-muted">Makelaar in Dubai</span>
      </Link>
      <div className="flex items-center gap-8">
        <nav aria-label="Snelmenu" className="hidden items-center gap-8 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link" aria-current={isActive(pathname, n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Menu />
      </div>
    </header>
  );
}

function Menu() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="menu-btn" aria-label="Menu" data-magnetic>
        <i />
        <i />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink px-[var(--gutter)] pb-8 text-ground"
          data-lenis-prevent
        >
          <div className="flex h-[var(--header-h)] items-center justify-between">
            <Dialog.Title className="text-small">Menu</Dialog.Title>
            <Dialog.Close className="min-h-11 px-3 text-small underline-offset-4 hover:underline" data-magnetic>
              Sluiten
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Ga naar een onderdeel van de site of neem contact op.</Dialog.Description>
          <nav aria-label="Hoofdmenu" className="mt-[6svh] grid gap-1">
            {menu.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, m.href) ? "page" : undefined}
                className="menu-link w-fit text-[clamp(2rem,1.2rem+2.6vw,3.5rem)] leading-[1.08] tracking-[-0.035em] transition-opacity duration-300 hover:opacity-60"
              >
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid gap-1 pt-16 text-small">
            <a className="w-fit underline decoration-1 underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a>
            <a className="w-fit underline decoration-1 underline-offset-4" href={site.instagram} rel="noopener">Instagram</a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
