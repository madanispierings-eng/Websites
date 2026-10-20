"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";
import { faqs } from "@/lib/faq";

/** The questions people ask before they call, grouped by topic; a native disclosure that opens smoothly. */
export function Faq() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);
  const topics = [...new Set(faqs.map((f) => f.topic))];

  return (
    <section ref={root} id="vragen" className="faq page-x" aria-labelledby="faq-title">
      <div className="faq-grid grid-12">
        <div className="faq-head" data-r-block>
          <h2 id="faq-title" data-r-title>
            Wat mensen ons vragen
          </h2>
          <p data-r>Staat jouw vraag er niet bij? Stel hem gewoon in het gesprek. Ook de vragen die je liever vooraf weet.</p>
        </div>
        <div className="faq-list">
          {topics.map((t) => (
            <div key={t} className="faq-group" data-r-block>
              <h3 data-r>{t}</h3>
              {faqs
                .filter((f) => f.topic === t)
                .map((f) => (
                  <details key={f.q} data-r>
                    <summary>
                      <span>{f.q}</span>
                      <i aria-hidden="true" />
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
