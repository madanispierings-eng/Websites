"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { Arrow } from "@/components/ui/arrow";
import { districts, hero, photoSrcSet, photoUrl } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const HOLD = 6; // seconds per view, shown by the bar filling

/**
 * The first screen: the promise in two lines on the left, the supporting line and the action beside it, and below
 * them Dubai from the air in a large rounded window that turns through four views, each wiping in from the right.
 * Opening: the lines rise, the window opens from a narrow band. On scroll the views drift and settle like every
 * photograph on the page. Under reduced motion there is no autoplay; the bars still switch the view.
 */
export function Hero() {
  const root = React.useRef<HTMLElement>(null);
  const [current, setCurrent] = React.useState(0);
  const go = React.useRef<(i: number) => void>(() => {});
  const view = districts[current];

  const { contextSafe } = useGSAP(
    () => {
      const section = root.current!;
      const html = document.documentElement;
      const media = section.querySelector<HTMLElement>(".hero-media")!;
      const track = section.querySelector<HTMLElement>(".slides")!;
      const slides = gsap.utils.toArray<HTMLElement>(".slide", section);
      const bars = gsap.utils.toArray<HTMLElement>(".slider-bars span", section);
      const caption = section.querySelector<HTMLElement>("[data-caption]")!;
      let index = 0;

      // Without motion: switch instantly.
      go.current = (i: number) => {
        slides.forEach((s, n) => gsap.set(s, { autoAlpha: n === i ? 1 : 0, zIndex: n === i ? 2 : 1 }));
        bars.forEach((b, n) => gsap.set(b, { scaleX: n === i ? 1 : 0 }));
        index = i;
        setCurrent(i);
      };

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let timer: gsap.core.Tween | undefined;
        let visible = true;

        const play = () => {
          timer?.kill();
          bars.forEach((b, n) => gsap.set(b, { scaleX: n < index ? 1 : 0 }));
          timer = gsap.fromTo(bars[index], { scaleX: 0 }, { scaleX: 1, duration: HOLD, ease: "none", onComplete: () => go.current((index + 1) % slides.length) });
          if (!visible || document.hidden) timer.pause();
        };

        go.current = (i: number) => {
          if (i === index) return play();
          const from = slides[index];
          const to = slides[i];
          gsap.killTweensOf([from, to, from.querySelector("img"), to.querySelector("img"), caption]);
          gsap.set(slides, { zIndex: 1 });
          gsap.set(from, { zIndex: 2, autoAlpha: 1 });
          gsap.set(to, { zIndex: 3, autoAlpha: 1 });
          const tl = gsap.timeline({ onComplete: () => void gsap.set(from, { autoAlpha: 0 }) });
          tl.fromTo(to, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0)
            .fromTo(to.querySelector("img"), { scale: 1.25, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 1.8, ease: "expo.out" }, 0)
            .to(from.querySelector("img"), { xPercent: -8, duration: 1.3, ease: "expo.inOut" }, 0)
            .set(from.querySelector("img"), { xPercent: 0 })
            .to(caption, { y: -12, opacity: 0, duration: 0.35, ease: "power2.in" }, 0.1)
            .add(() => setCurrent(i), 0.45)
            .fromTo(caption, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out" }, 0.5);
          index = i;
          play();
        };

        // Only run while the window is on screen and the tab is visible.
        ScrollTrigger.create({
          trigger: media,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            visible = self.isActive;
            if (visible && !document.hidden) timer?.resume();
            else timer?.pause();
          },
        });
        const onVisibility = () => (document.hidden ? timer?.pause() : visible && timer?.resume());
        document.addEventListener("visibilitychange", onVisibility);

        const scroll = () =>
          gsap.fromTo(
            track,
            { yPercent: 0, scale: 1.08 },
            { yPercent: 5, scale: 1, ease: "none", scrollTrigger: { trigger: media, start: "top top+=88", end: "bottom top", scrub: true } },
          );

        const begin = () => {
          scroll();
          play();
        };

        let cancelled = false;
        if (!html.classList.contains("intro")) begin();
        else
          Promise.all([document.fonts.ready, slides[0].querySelector("img")!.decode().catch(() => undefined)]).then(() => {
            if (cancelled) return;
            if (!html.classList.contains("intro")) return begin();
            const lines = section.querySelectorAll<HTMLElement>(".hero-title > span");
            const split = SplitText.create(lines, { type: "lines", mask: "lines" });
            const parts = section.querySelectorAll(".hero-support, .hero-cta");
            const header = document.querySelector("[data-header]");
            gsap.set(split.lines, { yPercent: 145 });
            gsap.set([parts, header], { y: 20, opacity: 0 });
            html.classList.remove("intro");
            gsap
              .timeline({
                defaults: { ease: "expo.out" },
                onComplete: () => {
                  split.revert();
                  begin();
                },
              })
              .to(split.lines, { yPercent: 0, duration: 1.2, stagger: 0.1 }, 0.1)
              .fromTo(
                media,
                { clipPath: "inset(38% 0% 38% 0% round 14px)" },
                { clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.5, ease: "expo.inOut", immediateRender: true, clearProps: "clipPath" },
                0.25,
              )
              .fromTo(slides[0].querySelector("img"), { scale: 1.3 }, { scale: 1, duration: 2 }, 0.25)
              .to(parts, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.6)
              .to(header, { y: 0, opacity: 1, duration: 1, clearProps: "transform,opacity" }, 0.8);
          });

        return () => {
          cancelled = true;
          timer?.kill();
          document.removeEventListener("visibilitychange", onVisibility);
          html.classList.remove("intro");
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const next = contextSafe(() => go.current((current + 1) % districts.length));

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
          <Link href="/contact/" className="btn" data-magnetic>
            {hero.action} <Arrow />
          </Link>
        </div>
      </div>

      <div className="hero-media media" data-media-static role="region" aria-roledescription="carrousel" aria-label="Dubai van bovenaf">
        <div className="slides" onClick={next} data-cursor="Volgende">
          {districts.map((d, i) => (
            <div key={d.id} className="slide" aria-hidden={i !== current}>
              {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked from Unsplash's CDN, which sizes per srcset */}
              <img
                src={photoUrl(d.photo, 1440)}
                srcSet={photoSrcSet(d.photo)}
                sizes="100vw"
                width={d.photo.width}
                height={d.photo.height}
                alt={d.photo.alt}
                style={{ objectPosition: d.photo.focus }}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
              />
            </div>
          ))}
        </div>
        <div className="scrim" />
        <div className="slider-ui">
          <div className="slider-caption" data-caption aria-live="polite">
            <h2>{view.name}</h2>
            <p>{view.line}</p>
          </div>
          <div className="slider-bars" role="group" aria-label="Kies een beeld">
            {districts.map((d, i) => (
              <button key={d.id} type="button" aria-label={d.name} aria-current={i === current} onClick={() => go.current(i)}>
                <span />
              </button>
            ))}
          </div>
          <p className="slider-credit">
            {view.coords} · Foto <a href={view.photo.byUrl}>{view.photo.by}</a> via <a href={view.photo.page}>Unsplash</a>
          </p>
        </div>
      </div>
    </section>
  );
}
