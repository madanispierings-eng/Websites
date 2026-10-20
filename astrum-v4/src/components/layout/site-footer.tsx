"use client";

import * as React from "react";
import gsap from "gsap";
import { useReveal } from "@/components/motion/reveal";
import { areas, districts, menu, process, services, site, type Photo } from "@/lib/content";

const photos: Photo[] = [
  ...districts.map((d) => d.photo),
  ...services.flatMap((s) => (s.detail ? [s.main, s.detail] : [s.main])),
  ...areas.map((a) => a.photo),
  ...process.steps.flatMap((s) => ("photo" in s && s.photo ? [s.photo] : [])),
];
const credits = [...new Map(photos.map((p) => [p.page, p])).values()];

/** The close: links in four columns, then the name across the full width, rising into place as it arrives. */
export function SiteFooter() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root, (el) => {
    const mark = el.querySelector(".footer-mark");
    const t = gsap.fromTo(mark, { yPercent: 35, scale: 0.94 }, { yPercent: 0, scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: true } });
    return () => t.scrollTrigger?.kill();
  });

  return (
    <footer ref={root} className="site-footer page-x">
      <div className="footer-cols" data-r-block>
        <div data-r>
          <p className="footer-lead">Boutique makelaar in Dubai, voor Nederlanders die verder kijken dan de brochure.</p>
        </div>
        <nav aria-label="Onderdelen" data-r>
          {menu.map((m) => (
            <a key={m.href} href={m.href} className="link-draw">
              {m.label}
            </a>
          ))}
        </nav>
        <div data-r>
          <a className="link-draw" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="link-draw" href={site.instagram} rel="noopener">Instagram</a>
          <a className="link-draw" href={site.linkedin} rel="noopener">LinkedIn</a>
          <span>Dubai, Verenigde Arabische Emiraten</span>
        </div>
      </div>
      <p className="footer-mark" aria-hidden="true" translate="no">
        ASTRUM
      </p>
      <div className="footer-legal">
        <p>© {new Date().getFullYear()} Astrum</p>
        <p className="credits">
          Foto’s van Dubai via Unsplash:{" "}
          {credits.map((p, i) => (
            <span key={p.page}>
              <a href={p.page}>{p.by}</a>
              {i < credits.length - 1 ? ", " : ". "}
            </span>
          ))}
          Teamfoto’s: Astrum.
        </p>
      </div>
    </footer>
  );
}
