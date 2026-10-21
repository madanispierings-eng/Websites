"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";
import type { Step } from "@/lib/content";

/** A short process as a real ordered list of words only: the name large, what happens beside it. */
export function Steps({ title, intro, steps }: { title: string; intro?: string; steps: Step[] }) {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="steps page-x" aria-labelledby="steps-title">
      <div className="steps-head" data-r-block>
        <h2 id="steps-title" data-r-title>
          {title}
        </h2>
        {intro && <p data-r>{intro}</p>}
      </div>
      <ol className="steps-list">
        {steps.map((s) => (
          <li key={s.name} data-r-block>
            <h3 data-r-title>{s.name}</h3>
            <p data-r>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
