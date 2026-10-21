"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { resetScroll } from "@/components/motion/smooth-scroll";

// The first page load has its own opening; only later navigations get the transition.
let navigated = false;

/**
 * Re-mounts on every navigation: a panel in the page's ink lifts away from the new page, and the page starts at the
 * top with its scroll triggers measured afresh. Pure CSS for the panel, so it never leaves the page covered.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [curtain] = React.useState(() => navigated);
  const pathname = usePathname();
  React.useEffect(() => {
    navigated = true;
  }, []);
  React.useLayoutEffect(() => {
    if (!curtain) return;
    resetScroll();
    ScrollTrigger.refresh();
    // once more after the new page's images and fonts have settled
    const id = gsap.delayedCall(0.3, () => ScrollTrigger.refresh());
    return () => void id.kill();
  }, [curtain, pathname]);
  return (
    <>
      {curtain && <div className="page-curtain" aria-hidden="true" />}
      {children}
    </>
  );
}
