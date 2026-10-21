"use client";

import * as React from "react";
import gsap from "gsap";
import { useReveal } from "@/components/motion/reveal";
import { photoSrcSet, photoUrl, process } from "@/lib/content";

/**
 * The four steps as a real ordered list. On wide screens the section holds still while the steps travel sideways
 * under the scroll; on a phone they simply stack.
 */
export function Process() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root, (el) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const track = el.querySelector<HTMLElement>(".process-track")!;
      const distance = () => Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
      });
      // each picture eases in its own frame while the row travels
      gsap.utils.toArray<HTMLElement>(".step-img img", el).forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: true } });
      });
    });
    return () => mm.revert();
  });

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
