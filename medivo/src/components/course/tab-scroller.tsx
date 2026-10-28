"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Horizontally scrollable tab strip that keeps the active tab in view on narrow screens. */
export function TabScroller({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const navBox = nav.getBoundingClientRect();
    const tabBox = active.getBoundingClientRect();
    nav.scrollLeft += tabBox.left - navBox.left - (navBox.width - tabBox.width) / 2;
  }, []);

  return (
    <nav ref={ref} aria-label={label} className={className}>
      {children}
    </nav>
  );
}
