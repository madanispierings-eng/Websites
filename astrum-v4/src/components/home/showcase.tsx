"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Arrow } from "@/components/ui/arrow";
import { Media } from "@/components/ui/media";
import { homes, site, type Home } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const ask = (h: Home) =>
  `mailto:${site.email}?subject=${encodeURIComponent(`${h.name} in Dubai`)}&body=${encodeURIComponent(
    `Hallo Astrum,\n\nIk ben benieuwd naar een ${h.name.toLowerCase()} in Dubai. Kunnen we een keer bellen?\n\n`,
  )}`;

function Text({ home, as: Tag = "div" }: { home: Home; as?: "div" | "figcaption" }) {
  return (
    <Tag className="sc-text">
      <h3 data-sc-title>{home.name}</h3>
      <p className="sc-where" data-sc-part>{home.where}</p>
      <p data-sc-part>{home.line}</p>
      <a className="link-draw" href={ask(home)} data-sc-part data-magnetic>
        Vraag ernaar <Arrow />
      </a>
    </Tag>
  );
}

/**
 * Kinds of homes Astrum helps people buy, in an uneven white layout: a wide penthouse with its detail beside it, a
 * tall tower to the right of centre, and a villa set large and low with the pool above its words.
 */
export function Showcase() {
  const root = React.useRef<HTMLElement>(null);
  const [penthouse, tower, villa] = homes;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 1. Parallax: each photograph is drawn at 1.1 in its window. While the window crosses the screen the
        //    picture drifts vertically (−5% to 5% of its 112% height, inside the slack) and settles from 1.1 to 1, like a camera dolly.
        gsap.utils.toArray<HTMLElement>("[data-media]").forEach((win) => {
          const img = win.querySelector("img")!;
          gsap.fromTo(
            img,
            { yPercent: -5, scale: 1.1 },
            {
              yPercent: 5,
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: win, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
          // 2. Reveal: the window opens from a smaller rounded frame as it enters (scrubbed, so it follows the hand).
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

        // 3. Words: the heading rises line by line, then the rest of the text, once per block.
        gsap.utils.toArray<HTMLElement>("[data-sc-block]").forEach((block) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: block, start: "top 80%", once: true } });
          block.querySelectorAll<HTMLElement>("[data-sc-title]").forEach((title) => {
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
          tl.from(block.querySelectorAll("[data-sc-part]"), { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.15);
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="woningen" className="showcase" aria-labelledby="sc-title">
      <div className="page-x">
        <header className="sc-head grid-12" data-sc-block>
          <h2 id="sc-title" data-sc-title>Zo woon je in Dubai</h2>
          <p data-sc-part>
            Van een penthouse boven Downtown tot een villa aan het water op de Palm. We laten zien wat er te koop is, met de
            prijzen die er echt betaald zijn ernaast.
          </p>
        </header>

        <article className="sc-item sc-a grid-12" data-sc-block aria-label={penthouse.name}>
          <Media className="sc-main" photo={penthouse.main} sizes="(min-width: 768px) 66vw, 100vw" />
          <div className="sc-side">
            {penthouse.detail && <Media className="sc-detail" photo={penthouse.detail} sizes="(min-width: 768px) 26vw, 64vw" />}
            <Text home={penthouse} />
          </div>
        </article>

        <article className="sc-item sc-b grid-12" data-sc-block aria-label={tower.name}>
          <Text home={tower} />
          <Media className="sc-main" photo={tower.main} sizes="(min-width: 768px) 42vw, 82vw" />
        </article>

        <article className="sc-item sc-c grid-12" data-sc-block aria-label={villa.name}>
          <div className="sc-side">
            {villa.detail && <Media className="sc-detail" photo={villa.detail} sizes="(min-width: 768px) 33vw, 64vw" />}
            <Text home={villa} />
          </div>
          <Media className="sc-main" photo={villa.main} sizes="(min-width: 768px) 66vw, 100vw" />
        </article>
      </div>
    </section>
  );
}
