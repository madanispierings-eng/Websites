"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let instance: Lenis | null = null;

/**
 * Start a new page at the top. Lenis may still be gliding towards a target on the previous page; an immediate,
 * forced scroll cancels that glide, so the new page is not carried down to the old position.
 */
export function resetScroll() {
  if (instance) instance.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

/** Lenis on GSAP's ticker, so ScrollTrigger reads the same scroll position every frame. Off under reduced motion. */
export function SmoothScroll() {
  React.useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A light lerp instead of a long duration: the page follows the wheel or trackpad at once and only the last few
    // pixels are smoothed, so it never feels as if it drags behind the hand. Touch scrolling stays native.
    const lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1, anchors: true });
    instance = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    // A jump Lenis did not make (scrollbar, keys, a script) becomes its new position, so the next wheel tick
    // continues from there instead of pulling the page back.
    const resync = () => {
      if (!lenis.isScrolling && Math.abs(window.scrollY - lenis.animatedScroll) > 3) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    };
    window.addEventListener("scroll", resync, { passive: true });
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
      window.removeEventListener("scroll", resync);
      lock.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      instance = null;
    };
  }, []);
  return null;
}
