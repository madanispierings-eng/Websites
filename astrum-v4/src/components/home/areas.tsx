"use client";

import * as React from "react";
import gsap from "gsap";
import { useReveal } from "@/components/motion/reveal";
import { areas, photoSrcSet, photoUrl } from "@/lib/content";

/**
 * The districts as a large list of names; the one you point at, focus or tap shows its picture in the window beside
 * the list, wiping up from below, with one plain line about the place.
 */
export function Areas() {
  const root = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(0);
  const shown = React.useRef(0);
  useReveal(root);

  const show = (i: number) => {
    if (i === shown.current) return;
    const win = root.current!.querySelector<HTMLElement>(".areas-window")!;
    const imgs = win.querySelectorAll<HTMLElement>(".area-img");
    const from = imgs[shown.current];
    const to = imgs[i];
    shown.current = i;
    setActive(i);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      imgs.forEach((im, n) => gsap.set(im, { autoAlpha: n === i ? 1 : 0, zIndex: n === i ? 2 : 1 }));
      return;
    }
    gsap.killTweensOf([to, to.querySelector("img")]);
    imgs.forEach((im) => gsap.set(im, { zIndex: im === to ? 3 : im === from ? 2 : 1 }));
    gsap.set(to, { autoAlpha: 1 });
    gsap.fromTo(to, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.inOut" });
    gsap.fromTo(to.querySelector("img"), { scale: 1.2 }, { scale: 1, duration: 1.4, ease: "expo.out" });
  };

  return (
    <section ref={root} id="wijken" className="areas page-x" aria-labelledby="areas-title">
      <div className="areas-grid grid-12">
        <div className="areas-list" data-r-block>
          <h2 id="areas-title" data-r-title>
            Waar je in Dubai kunt wonen
          </h2>
          <p className="areas-intro" data-r>
            Vijf wijken waar Nederlandse kopers vaak naar vragen. Elk met een eigen ritme, eigen prijzen en eigen regels.
          </p>
          <ul role="list">
            {areas.map((a, i) => (
              <li key={a.id} data-r>
                <button
                  type="button"
                  className="area-name"
                  aria-pressed={i === active}
                  onMouseEnter={() => show(i)}
                  onFocus={() => show(i)}
                  onClick={() => show(i)}
                >
                  <span>{a.name}</span>
                  <small>{a.coords}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="areas-side">
          <div className="areas-window media" data-media-static>
            {areas.map((a, i) => (
              <div key={a.id} className="area-img" style={i === 0 ? undefined : { visibility: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked from Unsplash's CDN, which sizes per srcset */}
                <img
                  src={photoUrl(a.photo, 1440)}
                  srcSet={photoSrcSet(a.photo)}
                  sizes="(min-width: 768px) 46vw, 100vw"
                  width={a.photo.width}
                  height={a.photo.height}
                  alt={a.photo.alt}
                  style={{ objectPosition: a.photo.focus }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
          <p className="areas-line" aria-live="polite">
            <strong>{areas[active].name}</strong> {areas[active].line}
            <span className="areas-credit">
              Foto <a href={areas[active].photo.byUrl}>{areas[active].photo.by}</a> via <a href={areas[active].photo.page}>Unsplash</a>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
