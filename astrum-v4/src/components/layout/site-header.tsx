"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { menu, nav, site } from "@/lib/content";

/** Wordmark left; on desktop four links and the menu square on the right. Steps aside while reading down. */
export function SiteHeader() {
  const ref = React.useRef<HTMLElement>(null);

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
            <a key={n.href} href={n.href} className="nav-link">
              {n.label}
            </a>
          ))}
        </nav>
        <Menu />
      </div>
    </header>
  );
}

function Menu() {
  return (
    <Dialog.Root>
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
          <nav aria-label="Hoofdmenu" className="mt-[8svh] grid gap-2">
            {menu.map((m) => (
              <Dialog.Close asChild key={m.href}>
                <a href={m.href} className="w-fit text-head transition-opacity duration-300 hover:opacity-60">
                  {m.label}
                </a>
              </Dialog.Close>
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
