"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const EASE = "expo.out";

/** Smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in step. Off under reduced motion. */
function useSmoothScroll() {
  const pathname = usePathname();
  const lenisRef = React.useRef<Lenis | null>(null);

  React.useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -96 } });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    // A jump Lenis did not make (keys, scrollbar, scrollTo) becomes its new position, so the next wheel tick
    // continues from there instead of snapping back.
    const resync = () => {
      if (Math.abs(window.scrollY - lenis.animatedScroll) > 3) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    };
    window.addEventListener("scroll", resync, { passive: true });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis");
    // Radix dialogs and sheets lock the body; pause smooth scrolling while they are open.
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
      lenisRef.current = null;
      document.documentElement.classList.remove("lenis");
    };
  }, []);

  // A new page starts at the top.
  React.useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);
}

/**
 * The page's motion layer. Markup opts in with data attributes:
 * - data-reveal on a section, data-r on its parts: headings rise line by line, pictures unmask, text fades up
 * - data-drift on a picture: slow scale while it crosses the screen
 * - data-hero*: the home page's opening and the city that opens to full width
 * - data-hscroll on a section with data-hscroll-track: steps that travel sideways while the section is pinned
 * - data-count: a figure that counts up
 * Everything is skipped under prefers-reduced-motion, so content is never left hidden.
 */
export function Motion({ children }: { children: React.ReactNode }) {
  const scope = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useSmoothScroll();

  useGSAP(
    () => {
      const root = scope.current!;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Home opening: the promise rises line by line, then the copy, then the city.
        const heroTitle = root.querySelector<HTMLElement>("[data-hero-title]");
        if (heroTitle) {
          SplitText.create(heroTitle, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, { yPercent: 110, duration: 1.4, ease: EASE, stagger: 0.12, delay: 0.35 }),
          });
          gsap.from("[data-hero-copy] > *", { y: 24, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.1, delay: 0.75 });
        }

        // Entrances, section by section.
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
          const parts = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-r]"));
          if (!parts.length) return;
          const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 82%", once: true } });
          parts.forEach((part, i) => {
            const at = i * 0.08;
            if (/^H[1-3]$/.test(part.tagName)) {
              SplitText.create(part, {
                type: "lines",
                mask: "lines",
                autoSplit: true,
                onSplit: (self) => {
                  const tween = gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: EASE, stagger: 0.08 });
                  tl.add(tween, at);
                  return tween;
                },
              });
            } else if (part.querySelector(":scope > img, :scope > video") || part.matches("[data-mask]")) {
              tl.fromTo(
                part,
                { clipPath: "inset(100% 0% 0% 0%)" },
                { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut", clearProps: "clipPath" },
                at,
              );
            } else {
              tl.from(part, { y: 28, opacity: 0, duration: 1, ease: EASE }, at);
            }
          });
        });

        // Pictures drift slightly while they pass.
        gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.12, yPercent: -3 },
            {
              scale: 1,
              yPercent: 3,
              ease: "none",
              scrollTrigger: { trigger: img.parentElement ?? img, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        // Figures count up once.
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const counter = { v: 0 };
          gsap.to(counter, {
            v: target,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            onUpdate: () => {
              el.textContent = `${Math.round(counter.v)}%`;
            },
          });
        });

        // The footer name settles into place.
        gsap.from("[data-footer-mark]", {
          yPercent: 40,
          opacity: 0,
          duration: 1.4,
          ease: EASE,
          scrollTrigger: { trigger: "[data-footer-mark]", start: "top 95%", once: true },
        });
      });

      // Desktop only: the city opens to the full width, and the steps travel sideways.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const stage = root.querySelector<HTMLElement>("[data-hero-stage]");
        if (stage) {
          gsap
            .timeline({ scrollTrigger: { trigger: stage, start: "top top", end: "+=70%", scrub: true, pin: true } })
            .to("[data-hero-frame]", { clipPath: "inset(0px 0px 0px 0px)", ease: "none" }, 0)
            .fromTo("[data-hero-img]", { scale: 1.12 }, { scale: 1, ease: "none" }, 0);
          gsap.from("[data-hero-frame]", { opacity: 0, y: 40, duration: 1.6, ease: EASE, delay: 0.5 });
        }

        const sideways = gsap.utils.toArray<HTMLElement>("[data-hscroll]");
        sideways.forEach((section) => {
          const track = section.querySelector<HTMLElement>("[data-hscroll-track]");
          if (!track) return;
          section.dataset.h = "true";
          const distance = () => Math.max(0, track.scrollWidth - (track.parentElement?.clientWidth ?? window.innerWidth));
          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 0.6,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
        });
        // Back to the stacked layout when the query stops matching.
        return () => sideways.forEach((section) => delete section.dataset.h);
      });

      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={scope}>{children}</div>;
}
