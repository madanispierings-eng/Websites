"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { districts, menu, site } from "@/lib/content";

/** The wordmark small top-left, one word top-right. Steps aside while reading down, returns on the way up. */
export function SiteHeader() {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      el.dataset.hidden = String(y > 120 && y > last && !el.contains(document.activeElement));
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
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-[var(--gutter)] pt-6 transition-transform duration-700 ease-out-expo data-[hidden=true]:-translate-y-[140%] md:pt-8"
      data-header
    >
      <Link href="/" className="wordmark flex min-h-11 w-[132px] items-center text-small" aria-label="Astrum, naar het begin" translate="no">
        {"ASTRUM".split("").map((l, i) => (
          <span key={i} aria-hidden="true">{l}</span>
        ))}
      </Link>
      <Menu />
    </header>
  );
}

function Menu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="-mr-3 min-h-11 px-3 text-small" data-magnetic>
        Menu
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-surface px-[var(--gutter)] pt-6 pb-8 text-ink md:pt-8"
          data-lenis-prevent
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="flex min-h-11 items-center text-small">Menu</Dialog.Title>
            <Dialog.Close className="-mr-3 min-h-11 px-3 text-small" data-magnetic>
              Sluiten
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Ga naar een onderdeel van de site of neem contact op.</Dialog.Description>
          <nav aria-label="Hoofdmenu" className="mt-[10svh] grid gap-1 md:mt-[14svh]">
            {menu.map((m) => (
              <Dialog.Close asChild key={m.href}>
                <a href={m.href} className="w-fit font-serif text-head transition-colors duration-300 hover:text-gold">
                  {m.label}
                </a>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-auto grid gap-6 pt-16 text-small md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-1">
              <a className="w-fit underline decoration-1 underline-offset-4 hover:text-gold" href={`mailto:${site.email}`}>{site.email}</a>
              <a className="w-fit underline decoration-1 underline-offset-4 hover:text-gold" href={site.instagram} rel="noopener">Instagram</a>
            </div>
            <p className="max-w-[44ch] text-muted">
              Foto’s via Unsplash:{" "}
              {districts.map((d, i) => (
                <React.Fragment key={d.id}>
                  <a className="underline decoration-1 underline-offset-2 hover:text-ink" href={d.photo.page}>{d.name}</a> door{" "}
                  <a className="underline decoration-1 underline-offset-2 hover:text-ink" href={d.photo.byUrl}>{d.photo.by}</a>
                  {i < districts.length - 1 ? ", " : "."}
                </React.Fragment>
              ))}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
