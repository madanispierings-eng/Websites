"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";
import { Arrow } from "@/components/ui/arrow";
import { Media } from "@/components/ui/media";
import Link from "next/link";
import { services, type Service } from "@/lib/content";


function Text({ home, as: Tag = "div" }: { home: Service; as?: "div" | "figcaption" }) {
  return (
    <Tag className="sc-text">
      <h3 data-r-title>{home.name}</h3>
      <p className="sc-where" data-r>{home.where}</p>
      <p data-r>{home.line}</p>
      <Link className="link-draw" href={home.href} data-r data-magnetic>
        Meer over {home.name.toLowerCase()} <Arrow />
      </Link>
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

  useReveal(root);

  return (
    <section ref={root} id="diensten" className="showcase" aria-labelledby="sc-title">
      <div className="page-x">
        <header className="sc-head grid-12" data-r-block>
          <h2 id="sc-title" data-r-title>Wat we voor je doen</h2>
          <p data-r>
            Persoonlijke begeleiding en korte lijnen. Je hebt één aanspreekpunt, in het Nederlands, van het eerste gesprek tot
            ver na de overdracht. Ook daarna, voor verhuur of je volgende stap.
          </p>
        </header>

        <article className="sc-item sc-a grid-12" data-r-block aria-label={buying.name}>
          <Media className="sc-main" photo={buying.main} sizes="(min-width: 768px) 66vw, 100vw" />
          <div className="sc-side">
            {buying.detail && <Media className="sc-detail" photo={buying.detail} sizes="(min-width: 768px) 26vw, 64vw" />}
            <Text home={buying} />
          </div>
        </article>

        <article className="sc-item sc-b grid-12" data-r-block aria-label={selling.name}>
          <Text home={selling} />
          <Media className="sc-main" photo={selling.main} sizes="(min-width: 768px) 42vw, 82vw" />
        </article>

        <article className="sc-item sc-c grid-12" data-r-block aria-label={advice.name}>
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
