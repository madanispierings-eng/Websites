"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The shared scroll motion of a section. Markup opts in with data attributes:
 * - data-media (see <Media>): the photograph drifts −5% to 5% of its 112% height and settles from 1.1 to 1 while its
 *   window crosses the screen; the window itself opens from a smaller rounded frame as it enters.
 * - data-r-block: a group whose parts enter together, once, as the group reaches 80% of the screen:
 *   data-r-title rises line by line behind a mask, data-r fades up 24px, staggered.
 * Everything is skipped under prefers-reduced-motion, so content is never left hidden.
 */
export function useReveal(scope: React.RefObject<HTMLElement | null>, extra?: (root: HTMLElement) => void | (() => void)) {
  useGSAP(
    () => {
      const root = scope.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-media]:not([data-media-static])", root).forEach((win) => {
          const img = win.querySelector("img");
          if (!img) return;
          gsap.fromTo(
            img,
            { yPercent: -5, scale: 1.1 },
            { yPercent: 5, scale: 1, ease: "none", scrollTrigger: { trigger: win, start: "top bottom", end: "bottom top", scrub: true } },
          );
          if (win.hasAttribute("data-media-noclip")) return;
          gsap.fromTo(
            win,
            { clipPath: "inset(14% 10% 14% 10% round 14px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 14px)",
              ease: "power2.out",
              scrollTrigger: { trigger: win, start: "top 95%", end: "top 45%", scrub: 0.8 },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-r-block]", root).forEach((block) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: block, start: "top 80%", once: true } });
          block.querySelectorAll<HTMLElement>("[data-r-title]").forEach((title) => {
            SplitText.create(title, {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit: (self) => {
                const tween = gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08 });
                tl.add(tween, 0);
                return tween;
              },
            });
          });
          const parts = block.querySelectorAll("[data-r]");
          if (parts.length) tl.from(parts, { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.15);
        });

        return extra?.(root);
      });
      return () => mm.revert();
    },
    { scope },
  );
}
