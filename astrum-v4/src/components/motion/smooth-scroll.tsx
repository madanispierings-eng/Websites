"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/** Lenis on GSAP's ticker, so ScrollTrigger reads the same scroll position every frame. Off under reduced motion. */
export function SmoothScroll() {
  React.useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Radix locks the body while the menu is open; smooth scrolling pauses with it.
    const lock = new MutationObserver(() => {
      if (document.body.hasAttribute("data-scroll-locked")) lenis.stop();
      else lenis.start();
    });
    lock.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => {
      lock.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
