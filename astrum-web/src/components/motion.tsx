"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The page's motion layer. Markup opts in with data attributes:
 * - data-reveal on a section, data-r on its parts: staggered entrance, once
 * - data-drift on a picture: slow scale while it crosses the screen
 * - data-hero / data-wordmark / data-hero-copy: the home page's opening
 * Everything is skipped under prefers-reduced-motion, so content is never left hidden.
 */
export function Motion({ children }: { children: React.ReactNode }) {
  const scope = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = scope.current!;

        // Home: the name rises, then the copy; as the hero leaves, the name grows heavy.
        const hero = root.querySelector("[data-hero]");
        if (hero) {
          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.from("[data-hero] img", { scale: 1.12, duration: 1.6 }, 0)
            .from("[data-wordmark]", { yPercent: 30, opacity: 0, duration: 1.3 }, 0.15)
            .from("[data-hero-copy] > *", { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.45);
          gsap.to("[data-wordmark]", {
            scale: 0.93,
            transformOrigin: "100% 100%",
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          });
        }

        // Entrances: heading, text, picture, staggered as each section arrives.
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
          if (section.matches("[data-hero]")) return;
          const parts = section.querySelectorAll<HTMLElement>("[data-r]");
          if (!parts.length) return;
          gsap.from(parts, {
            y: 28,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.075,
            scrollTrigger: { trigger: section, start: "top 85%", once: true },
          });
        });

        // Pictures drift slightly while they pass.
        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.1 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: img.parentElement ?? img, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        // The big figures count up once.
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const counter = { v: 0 };
          gsap.to(counter, {
            v: target,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            onUpdate: () => {
              el.textContent = `${Math.round(counter.v)}%`;
            },
          });
        });
      });
      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={scope}>{children}</div>;
}
