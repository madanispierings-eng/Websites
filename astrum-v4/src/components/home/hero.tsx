"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { districts, hero, photoSrcSet, photoUrl } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const HOLD = 5.5; // seconds each district stays in the vitrine
const FADE = 1.6; // the crossfade, like light shifting in a room

/**
 * The counter: Dubai as the one precious object in a vitrine, on a bottle-green field.
 * Under it the name as a wide, low wordmark, one serif sentence, and one row: where you are looking, the action,
 * and what Astrum promises.
 *
 * Motion: an opening (the vitrine wipes up, the letters spread out like a dial, the sentence rises word by word),
 * the vitrine slowly turning through four districts, and on scroll the vitrine opening to the whole city.
 * Under prefers-reduced-motion the hero simply stands, with the first district only.
 */
export function Hero() {
  const root = React.useRef<HTMLElement>(null);
  const [current, setCurrent] = React.useState(0);
  const district = districts[current];

  useGSAP(
    () => {
      const section = root.current!;
      const html = document.documentElement;
      const stage = section.querySelector<HTMLElement>(".stage")!;
      const frame = section.querySelector<HTMLElement>(".stage-frame")!;
      const imgs = gsap.utils.toArray<HTMLImageElement>("[data-vitrine-img]", section);
      const letters = gsap.utils.toArray<HTMLElement>("[data-hero-letter]", section);
      const sentence = section.querySelector<HTMLElement>("[data-hero-sentence]")!;
      const parts = gsap.utils.toArray<HTMLElement>("[data-hero-part]", section);
      const copy = section.querySelector<HTMLElement>(".hero-copy")!;
      const caption = section.querySelector<HTMLElement>(".stage-caption")!;
      const header = document.querySelector<HTMLElement>("[data-header]");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let cancelled = false;
        let cycle: gsap.core.Tween | undefined;
        let index = 0;

        // The vitrine turns through the districts while the visitor is at the top of the page.
        const next = () => {
          const from = imgs[index];
          index = (index + 1) % imgs.length;
          const to = imgs[index];
          gsap.set(to, { zIndex: 2 });
          gsap.set(from, { zIndex: 1 });
          gsap.fromTo(to, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: FADE, ease: "power2.inOut" });
          gsap.to(from, { opacity: 0, duration: FADE, delay: FADE * 0.6, ease: "none" });
          gsap.to("[data-vitrine-label]", {
            opacity: 0,
            y: -6,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
              setCurrent(index);
              gsap.fromTo("[data-vitrine-label]", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
            },
          });
          schedule();
        };
        const schedule = () => {
          cycle = gsap.delayedCall(HOLD + FADE, () => {
            if (document.hidden || window.scrollY > 8) schedule();
            else next();
          });
        };

        // On scroll the vitrine opens to the whole screen: the clip grows to the edges while the photograph scales
        // from its frame to cover the view; the copy steps back and the caption arrives.
        const scene = () => {
          // Layout boxes, not transformed ones, so a refresh in the middle of the scene measures the same frame.
          const geo = () => ({
            l: frame.offsetLeft,
            t: frame.offsetTop,
            w: frame.offsetWidth,
            h: frame.offsetHeight,
            W: section.clientWidth,
            H: section.clientHeight,
          });
          const box = () => {
            const g = geo();
            return `inset(${g.t}px ${g.W - g.l - g.w}px ${g.H - g.t - g.h}px ${g.l}px)`;
          };
          const cover = () => {
            const g = geo();
            return { s: Math.max(g.W / g.w, g.H / g.h), x: g.W / 2 - (g.l + g.w / 2), y: g.H / 2 - (g.t + g.h / 2) };
          };
          const desktop = matchMedia("(min-width: 768px)").matches;
          gsap
            .timeline({
              defaults: { ease: "power2.inOut" },
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: desktop ? "+=120%" : "+=80%",
                scrub: 0.6,
                pin: true,
                invalidateOnRefresh: true,
              },
            })
            .to(copy, { y: -60, opacity: 0, duration: 0.35, ease: "power2.in" }, 0)
            .fromTo(stage, { clipPath: box }, { clipPath: "inset(0px 0px 0px 0px)", duration: 1 }, 0)
            .fromTo(frame, { x: 0, y: 0, scale: 1 }, { x: () => cover().x, y: () => cover().y, scale: () => cover().s, duration: 1 }, 0)
            .to(caption, { opacity: 1, duration: 0.2, ease: "none" }, 0.85);
        };

        const start = () => {
          scene();
          schedule();
        };

        if (!html.classList.contains("intro")) {
          start();
        } else {
          Promise.all([document.fonts.ready, imgs[0].decode().catch(() => undefined)]).then(() => {
            if (cancelled) return;
            // The head script lifts the class after four seconds; if it already did, the hero is showing.
            if (!html.classList.contains("intro")) return start();

            const r = frame.getBoundingClientRect();
            const w = section.clientWidth;
            const h = section.clientHeight;
            const line = `inset(${r.bottom}px ${w - r.right}px ${h - r.bottom}px ${r.left}px)`;
            const open = `inset(${r.top}px ${w - r.right}px ${h - r.bottom}px ${r.left}px)`;
            const mid = r.left + r.width / 2;
            const split = SplitText.create(sentence, { type: "words", mask: "words" });

            gsap.set(letters, { x: (_i, el: HTMLElement) => (mid - (el.getBoundingClientRect().left + el.offsetWidth / 2)) * 0.88, opacity: 0 });
            gsap.set(split.words, { yPercent: 105 });
            gsap.set([parts, header], { y: 18, opacity: 0 });
            html.classList.remove("intro");

            gsap
              .timeline({ defaults: { ease: "expo.out" }, onComplete: () => { split.revert(); start(); } })
              // fromTo with both ends written out: the browser shortens a read-back inset with equal sides to three
              // values, which GSAP would pair up wrongly
              .fromTo(stage, { clipPath: line }, { clipPath: open, duration: 1.3, ease: "expo.inOut", immediateRender: true, clearProps: "clipPath" }, 0)
              .fromTo(imgs[0], { scale: 1.18 }, { scale: 1, duration: 1.9 }, 0)
              .to(letters, { x: 0, opacity: 1, duration: 1.5, stagger: { each: 0.03, from: "center" } }, 0.45)
              .to(split.words, { yPercent: 0, duration: 1.1, stagger: 0.045 }, 0.75)
              .to(parts, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 }, 1.1)
              .to(header, { y: 0, opacity: 1, duration: 0.9, clearProps: "transform,opacity" }, 1.3);
          });
        }

        return () => {
          cancelled = true;
          cycle?.kill();
          html.classList.remove("intro");
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title" data-hero>
      <div className="stage">
        <a href="#wijken" className="stage-frame block" data-cursor="Bekijk" aria-label={`Bekijk de wijken, nu ${district.name}`}>
          {districts.map((d, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- hotlinked from Unsplash's CDN, which sizes per srcset
            <img
              key={d.id}
              src={photoUrl(d.photo, 960)}
              srcSet={photoSrcSet(d.photo)}
              sizes="100vw"
              width={d.photo.width}
              height={d.photo.height}
              alt={i === current ? d.photo.alt : ""}
              style={{ objectPosition: d.photo.focus }}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              data-vitrine-img
            />
          ))}
        </a>
        <p className="stage-caption">
          <span data-vitrine-label>
            {district.name} · <span className="coords">{district.coords}</span>
          </span>
          <span className="text-ink/80">
            Foto <a className="underline decoration-1 underline-offset-2" href={district.photo.byUrl}>{district.photo.by}</a> via{" "}
            <a className="underline decoration-1 underline-offset-2" href={district.photo.page}>Unsplash</a>
          </span>
        </p>
      </div>

      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title" translate="no">
          <span className="sr-only">Astrum, makelaar in Dubai</span>
          <span className="wordmark" aria-hidden="true">
            {"ASTRUM".split("").map((l, i) => (
              <span key={i} data-hero-letter>{l}</span>
            ))}
          </span>
        </h1>
        <p className="hero-sentence" data-hero-sentence>{hero.sentence}</p>
        <div className="hero-row">
          <p data-hero-part>
            <span className="inline-block" data-vitrine-label>
              {district.name} · <span className="coords">{district.coords}</span>
            </span>
          </p>
          <div data-hero-part>
            <a href="#contact" className="btn-gold" data-magnetic>{hero.action}</a>
          </div>
          <p data-hero-part>{hero.specRight}</p>
        </div>
      </div>
    </section>
  );
}
