"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Arrow } from "@/components/ui/arrow";
import { Media } from "@/components/ui/media";
import { districts, hero } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The first screen: the promise in two lines on the left, the supporting line and the action beside it, and Dubai
 * from the air underneath, large. Opening: the lines rise, the picture opens from a narrow band and settles.
 * On scroll the picture drifts and settles from 1.1 to 1, like the showcase photographs.
 */
export function Hero() {
  const root = React.useRef<HTMLElement>(null);
  const palm = districts[0];

  useGSAP(
    () => {
      const section = root.current!;
      const html = document.documentElement;
      const media = section.querySelector<HTMLElement>(".hero-media")!;
      const img = media.querySelector("img")!;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const scroll = () =>
          gsap.fromTo(
            img,
            { yPercent: 0, scale: 1.1 },
            { yPercent: 5, scale: 1, ease: "none", scrollTrigger: { trigger: media, start: "top top+=88", end: "bottom top", scrub: true } },
          );

        if (!html.classList.contains("intro")) {
          scroll();
          return;
        }
        let cancelled = false;
        Promise.all([document.fonts.ready, img.decode().catch(() => undefined)]).then(() => {
          if (cancelled) return;
          if (!html.classList.contains("intro")) return void scroll();
          const lines = section.querySelectorAll<HTMLElement>(".hero-title > span");
          const split = SplitText.create(lines, { type: "lines", mask: "lines" });
          const parts = section.querySelectorAll(".hero-support, .hero-cta");
          const header = document.querySelector("[data-header]");
          gsap.set(split.lines, { yPercent: 110 });
          gsap.set([parts, header], { y: 20, opacity: 0 });
          html.classList.remove("intro");
          gsap
            .timeline({
              defaults: { ease: "expo.out" },
              onComplete: () => {
                split.revert();
                scroll();
              },
            })
            .to(split.lines, { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.1)
            .fromTo(
              media,
              { clipPath: "inset(38% 0% 38% 0% round 14px)" },
              { clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.5, ease: "expo.inOut", immediateRender: true, clearProps: "clipPath" },
              0.25,
            )
            .fromTo(img, { scale: 1.25 }, { scale: 1.1, duration: 2 }, 0.25)
            .to(parts, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.6)
            .to(header, { y: 0, opacity: 1, duration: 1, clearProps: "transform,opacity" }, 0.8);
        });
        return () => {
          cancelled = true;
          html.classList.remove("intro");
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="hero-head grid-12 page-x">
        <h1 id="hero-title" className="hero-title">
          {hero.title.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </h1>
        <p className="hero-support">
          {hero.support.map((l) => (
            <span key={l}>{l} </span>
          ))}
        </p>
        <div className="hero-cta">
          <a href="#contact" className="btn" data-magnetic>
            {hero.action} <Arrow />
          </a>
        </div>
      </div>
      <Media className="hero-media" photo={palm.photo} sizes="100vw" priority label={null}>
        <div className="scrim" />
        <p className="hero-caption">
          <span>
            {palm.name} · {palm.coords}
          </span>
          <span>
            Foto <a href={palm.photo.byUrl}>{palm.photo.by}</a> via <a href={palm.photo.page}>Unsplash</a>
          </span>
        </p>
      </Media>
    </section>
  );
}
