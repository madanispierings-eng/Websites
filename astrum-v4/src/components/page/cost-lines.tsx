"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";
import { purchaseCosts } from "@/lib/costs";

// Every line the calculator can show, once, with what it is for.
const all = [...purchaseCosts(1_000_000, "mortgage"), ...purchaseCosts(1_000_000, "offplan")].filter(
  (l, i, a) => a.findIndex((x) => x.name === l.name) === i,
);

/** Each cost line explained in a sentence, as a plain two-column list. */
export function CostLines() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="cost-lines page-x" aria-labelledby="lines-title">
      <div className="grid-12 cost-lines-grid">
        <div className="cost-lines-head" data-r-block>
          <h2 id="lines-title" data-r-title>
            Elke kostenpost uitgelegd
          </h2>
          <p data-r>Indicatief, op basis van de gangbare tarieven in Dubai. Voor jouw aankoop rekenen we het tot op de dirham na.</p>
        </div>
        <dl className="cost-lines-list">
          {all.map((l) => (
            <div key={l.name} data-r-block>
              <dt data-r>
                {l.name}
                <span>{l.note}</span>
              </dt>
              <dd data-r>{l.explain}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
