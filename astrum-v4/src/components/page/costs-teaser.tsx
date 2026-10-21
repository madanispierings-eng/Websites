"use client";

import * as React from "react";
import Link from "next/link";
import { useReveal } from "@/components/motion/reveal";
import { Arrow } from "@/components/ui/arrow";

/** The real number, large: what every purchase in Dubai costs on top, and the way to the calculator. */
export function CostsTeaser() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="costs costs-teaser" aria-labelledby="teaser-title">
      <div className="costs-grid grid-12 page-x" data-r-block>
        <p className="teaser-figure" data-r aria-hidden="true">
          4%
        </p>
        <div className="teaser-text">
          <h2 id="teaser-title" data-r-title>
            Wat kopen echt kost
          </h2>
          <p data-r>
            Overdrachtsbelasting bij elke aankoop in Dubai, plus een handvol vaste bedragen. Kies een prijs en zie het
            totaal, voordat iemand je een brochure laat zien.
          </p>
          <Link href="/kosten/" className="btn btn-light" data-r data-magnetic>
            Reken het uit <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
