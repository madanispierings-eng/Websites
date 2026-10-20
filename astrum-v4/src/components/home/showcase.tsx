"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Arrow } from "@/components/ui/arrow";
import { Media } from "@/components/ui/media";
import { services, site, type Service } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const ask = (h: Service) =>
  `mailto:${site.email}?subject=${encodeURIComponent(`Gesprek over ${h.ask}`)}&body=${encodeURIComponent(
    `Hallo Astrum,\n\nIk wil graag een keer praten over ${h.ask}. Wanneer komt het jullie uit?\n\n`,
  )}`;

function Text({ home, as: Tag = "div" }: { home: Service; as?: "div" | "figcaption" }) {
  return (
    <Tag className="sc-text">
      <h3 data-sc-title>{home.name}</h3>
      <p className="sc-where" data-sc-part>{home.where}</p>
      <p data-sc-part>{home.line}</p>
      <a className="link-draw" href={ask(home)} data-sc-part data-magnetic>
        Plan een gesprek <Arrow />
      </a>
    </Tag>
  );
}

/**
 * What Astrum does, in an uneven white layout over photographs taken in Dubai: buying with a wide interior and its
 * detail beside it, selling beside a tall picture right of centre, advice with Downtown set large and low.
 */
export function Showcase() {
  const root = React.useRef<HTMLElement>(null);
  const [buying, selling, advice] = services;

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
    <section ref={root} id="diensten" className="showcase" aria-labelledby="sc-title">
      <div className="page-x">
        <header className="sc-head grid-12" data-sc-block>
          <h2 id="sc-title" data-sc-title>Wat we voor je doen</h2>
          <p data-sc-part>
            Persoonlijke begeleiding en korte lijnen. Je hebt één aanspreekpunt, in het Nederlands, van het eerste gesprek tot
            ver na de overdracht. Ook daarna, voor verhuur of je volgende stap.
          </p>
        </header>

        <article className="sc-item sc-a grid-12" data-sc-block aria-label={buying.name}>
          <Media className="sc-main" photo={buying.main} sizes="(min-width: 768px) 66vw, 100vw" />
          <div className="sc-side">
            {buying.detail && <Media className="sc-detail" photo={buying.detail} sizes="(min-width: 768px) 26vw, 64vw" />}
            <Text home={buying} />
          </div>
        </article>

        <article className="sc-item sc-b grid-12" data-sc-block aria-label={selling.name}>
          <Text home={selling} />
          <Media className="sc-main" photo={selling.main} sizes="(min-width: 768px) 42vw, 82vw" />
        </article>

        <article className="sc-item sc-c grid-12" data-sc-block aria-label={advice.name}>
          <div className="sc-side">
            {advice.detail && <Media className="sc-detail" photo={advice.detail} sizes="(min-width: 768px) 33vw, 64vw" />}
            <Text home={advice} />
          </div>
          <Media className="sc-main" photo={advice.main} sizes="(min-width: 768px) 66vw, 100vw" />
        </article>
      </div>
    </section>
  );
}
