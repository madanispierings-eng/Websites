"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReveal } from "@/components/motion/reveal";
import { photoSrcSet, photoUrl, process } from "@/lib/content";

/**
 * The four steps as a real ordered list. On wide screens the section holds still while the steps travel sideways
 * under the scroll; on a phone they simply stack.
 */
export function Process() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);

  // Its own context, not nested in the reveal's: a pinned trigger made inside another matchMedia context broke
  // ScrollTrigger's refresh when a page was entered while the previous one was still scrolling.
  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const track = el.querySelector<HTMLElement>(".process-track")!;
        const distance = () => Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
        });
        tl.to(track, { x: () => -distance(), ease: "none" }, 0);
        // each picture eases in its own frame while the row travels
        gsap.utils.toArray<HTMLElement>(".step-img img", el).forEach((img) => tl.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none" }, 0));
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="process" aria-labelledby="process-title">
      <div className="process-inner page-x">
        <div className="process-head" data-r-block>
          <h2 id="process-title" data-r-title>
            {process.title}
          </h2>
          <p data-r>{process.intro}</p>
        </div>
        <div className="process-viewport">
          <ol className="process-track">
            {process.steps.map((s) => {
              const p = "photo" in s && s.photo ? s.photo : null;
              const local = "local" in s ? s.local : null;
              return (
                <li key={s.name} className="step">
                  <div className="step-img media" data-media-static>
                    {/* eslint-disable-next-line @next/next/no-img-element -- Unsplash CDN or Astrum's own photograph */}
                    <img
                      src={p ? photoUrl(p, 1440) : local!.src}
                      srcSet={p ? photoSrcSet(p) : undefined}
                      sizes="(min-width: 1024px) 38vw, 100vw"
                      width={p ? p.width : local!.width}
                      height={p ? p.height : local!.height}
                      alt={p ? p.alt : local!.alt}
                      style={{ objectPosition: p ? p.focus : local!.focus }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
