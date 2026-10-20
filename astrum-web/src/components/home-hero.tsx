"use client";

import * as React from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BookingButton } from "@/components/booking";
import { MobileMenu } from "@/components/site-header";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LETTERS = ["A", "S", "T", "R", "U", "M"];
const PORCELAIN = "#f2efe8";
// Height of the lit towers in the photograph, as a share of its height.
const SKYLINE = 0.47;

const heroLinks = [
  { href: "/kopen/", label: "Kopen" },
  { href: "/kosten/", label: "Kosten" },
  { href: "/over-ons/", label: "Over ons" },
  { href: "/contact/", label: "Contact" },
];

/** Where the city's pixels land for an object-fit: cover image, so the letters can show exactly the same view. */
function coverBox(img: HTMLImageElement) {
  const box = img.getBoundingClientRect();
  const s = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
  return { x: box.left + (box.width - w) * px, y: box.top + (box.height - h) * py, w, h };
}

/**
 * ASTRUM as a monument under Dubai at night.
 * Opening (about two seconds): the letters rise one by one with the city inside them, the picture grows out of the
 * letters to the full photograph, the letters turn solid, then the sentence, the action and the links.
 * While scrolling away the name settles (scale 1 to 0.94) and the photograph eases back (1.08 to 1).
 * Under prefers-reduced-motion nothing of this runs and the hero is simply there.
 */
export function HomeHero() {
  const root = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const hero = root.current!;
      const html = document.documentElement;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const photo = hero.querySelector<HTMLElement>(".hero-photo")!;
        const img = photo.querySelector("img")!;
        const name = hero.querySelector<HTMLElement>(".hero-name")!;
        const scroll = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
        gsap.fromTo(img, { scale: 1.08 }, { scale: 1, ease: "none", scrollTrigger: scroll });
        gsap.fromTo(name, { scale: 1 }, { scale: 0.94, ease: "none", scrollTrigger: scroll });

        if (!html.classList.contains("intro")) return;
        const glyphs = gsap.utils.toArray<HTMLElement>(".hero-glyph", hero);
        const fades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]", hero);
        let tl: gsap.core.Timeline | undefined;
        let cancelled = false;

        Promise.all([document.fonts.ready, img.decode().catch(() => undefined)]).then(() => {
          // The head script lifts the class after four seconds; if it already did, the hero is showing, so skip.
          if (cancelled || !html.classList.contains("intro") || !img.naturalWidth) return;

          const h = hero.getBoundingClientRect();
          const row = hero.querySelector(".hero-letters")!.getBoundingClientRect();
          const bandTop = hero.querySelector<HTMLElement>(".hero-band")!.offsetTop;

          // The city starts lowered so its lit towers stand inside the letters, then rises to its place.
          let city = coverBox(img);
          const drop = row.top + row.height / 2 - (city.y + SKYLINE * city.h);
          gsap.set(img, { y: drop });
          city = coverBox(img);

          // Fill each letter with that same view of the city, as if all six were cut from one sheet.
          const src = `url("${img.currentSrc || img.src}")`;
          glyphs.forEach((g) => {
            const r = (g.parentElement as HTMLElement).getBoundingClientRect();
            g.classList.add("is-cut");
            gsap.set(g, {
              backgroundImage: src,
              backgroundSize: `${city.w}px ${city.h}px`,
              backgroundPosition: `${city.x - r.left}px ${city.y - r.top}px`,
            });
          });

          // The picture starts as the letters' own box and grows up to its place above the band.
          const from = `inset(${row.top - h.top}px ${h.right - row.right}px ${h.bottom - row.bottom}px ${row.left - h.left}px)`;
          const to = `inset(0px 0px ${h.height - bandTop}px 0px)`;
          const grow = { duration: 1.2, ease: "expo.inOut" };

          gsap.set(glyphs, { y: 0, yPercent: 105 });
          gsap.set(fades, { opacity: 0, y: 16 });
          gsap.set(photo, { opacity: 0 });
          html.classList.remove("intro");

          tl = gsap
            .timeline({
              defaults: { ease: "expo.out" },
              onComplete: () => {
                glyphs.forEach((g) => g.classList.remove("is-cut"));
                gsap.set(glyphs, { clearProps: "all" });
              },
            })
            .to(glyphs, { yPercent: 0, duration: 1.05, stagger: 0.07 }, 0.1)
            .to(photo, { opacity: 1, duration: 0.35, ease: "none" }, 0.95)
            .fromTo(photo, { clipPath: from }, { clipPath: to, ...grow, clearProps: "clipPath" }, 0.95)
            .to(img, { y: 0, ...grow }, 0.95)
            // the view inside the letters rises with the picture, so the two stay one image
            .to(glyphs, { backgroundPositionY: `-=${drop}`, ...grow }, 0.95)
            .to(glyphs, { color: PORCELAIN, duration: 0.6, ease: "power2.out", stagger: 0.03 }, 1.35)
            .to(fades, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 1.7);
        });

        return () => {
          cancelled = true;
          tl?.progress(1).kill();
          html.classList.remove("intro");
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="hero dark" data-hero aria-labelledby="hero-title">
      <div className="hero-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export: sized sources by hand */}
        <img
          src="/img/night-1600.jpg"
          srcSet="/img/night-960.jpg 960w, /img/night-1600.jpg 1600w, /img/night-2560.jpg 2560w"
          sizes="(max-width: 767px) 172vh, (max-aspect-ratio: 3/2) 150vh, 100vw"
          width={2560}
          height={1707}
          alt="Dubai bij nacht: de torens van Downtown en Burj Khalifa boven het water van de Business Bay"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <nav aria-label="Hoofdmenu" className="hero-nav absolute top-5 right-[var(--gutter)] z-10 md:top-6" data-hero-fade>
        <ul className="hidden items-center gap-7 text-small lg:flex">
          {heroLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="underline decoration-transparent decoration-1 underline-offset-[0.3em] hover:decoration-gold">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <MobileMenu className="-mr-3 lg:hidden" />
      </nav>

      <div className="hero-band">
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-start md:justify-between md:gap-8">
          <p className="max-w-[30rem] text-body md:max-w-[min(30rem,40vw)]" data-hero-fade>
            Boutique makelaar in Dubai, voor Nederlanders die verder kijken dan de brochure.
          </p>
          <div data-hero-fade>
            <BookingButton className="px-7" magnetic />
          </div>
        </div>

        <h1 id="hero-title" className="hero-name" translate="no">
          <span className="sr-only">Astrum</span>
          <span className="hero-letters" aria-hidden="true">
            {LETTERS.map((l, i) => (
              <span key={i} className="hero-letter">
                <span className="hero-glyph">{l}</span>
              </span>
            ))}
          </span>
        </h1>
      </div>
    </section>
  );
}
