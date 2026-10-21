"use client";

import * as React from "react";
import Link from "next/link";
import { useReveal } from "@/components/motion/reveal";
import { Arrow } from "@/components/ui/arrow";
import { Media } from "@/components/ui/media";
import type { LocalPhoto, Photo } from "@/lib/content";

/**
 * The opening of an inner page, in the same manner as the home page: the title in two lines on the left, one
 * sentence and the action beside it, and one large photograph below that drifts and settles while you scroll.
 */
export function PageHero({
  title,
  intro,
  photo,
  local,
  action = { href: "/contact/", label: "Plan een gesprek" },
}: {
  title: string[];
  intro: string;
  photo?: Photo;
  local?: LocalPhoto;
  action?: { href: string; label: string } | null;
}) {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section ref={root} className="hero page-hero" aria-labelledby="page-title">
      <div className="hero-head grid-12 page-x" data-r-block>
        <h1 id="page-title" className="hero-title" data-r-title>
          {title.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </h1>
        <p className="hero-support" data-r>
          {intro}
        </p>
        {action && (
          <div className="hero-cta" data-r>
            <Link href={action.href} className="btn" data-magnetic>
              {action.label} <Arrow />
            </Link>
          </div>
        )}
      </div>
      {photo && (
        <Media className="page-hero-media" photo={photo} sizes="100vw" priority label={null}>
          <div className="scrim" />
          <p className="hero-caption">
            <span />
            <span>
              Foto <a href={photo.byUrl}>{photo.by}</a> via <a href={photo.page}>Unsplash</a>
            </span>
          </p>
        </Media>
      )}
      {local && (
        <div className="media page-hero-media" data-media>
          {/* eslint-disable-next-line @next/next/no-img-element -- Astrum's own photograph, already sized */}
          <img src={local.src} width={local.width} height={local.height} alt={local.alt} style={{ objectPosition: local.focus }} />
        </div>
      )}
    </section>
  );
}
