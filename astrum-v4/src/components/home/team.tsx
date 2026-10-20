"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";
import { team } from "@/lib/content";

/** Astrum's own people, their own photographs, set at uneven heights beside the words. */
export function Team() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section ref={root} id="over-ons" className="team page-x" aria-labelledby="team-title">
      <div className="team-grid grid-12">
        <div className="team-text" data-r-block>
          <h2 id="team-title" data-r-title>
            {team.title}
          </h2>
          <p data-r>{team.intro}</p>
          <blockquote data-r>“{team.quote}”</blockquote>
        </div>
        <ul className="team-people" role="list">
          {team.people.map((p) => (
            <li key={p.name} data-r-block>
              <div className="media team-photo" data-media data-media-noclip>
                {/* eslint-disable-next-line @next/next/no-img-element -- Astrum's own photograph, already sized */}
                <img src={p.photo.src} width={p.photo.width} height={p.photo.height} alt={p.photo.alt} style={{ objectPosition: p.photo.focus }} loading="lazy" decoding="async" />
              </div>
              <p className="team-name" data-r>
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </p>
              {"note" in p && p.note && (
                <p className="team-note" data-r>
                  {p.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
