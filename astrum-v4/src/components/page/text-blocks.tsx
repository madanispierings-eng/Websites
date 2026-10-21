"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";

/** Two or three short subjects side by side: a heading and a paragraph each, nothing else. */
export function TextBlocks({ title, blocks }: { title?: string; blocks: { name: string; text: string }[] }) {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="text-blocks page-x" aria-label={title ?? blocks[0].name}>
      {title && (
        <div data-r-block>
          <h2 className="text-blocks-title" data-r-title>
            {title}
          </h2>
        </div>
      )}
      <div className="text-blocks-grid" data-count={blocks.length}>
        {blocks.map((b) => (
          <div key={b.name} data-r-block>
            <h3 data-r-title>{b.name}</h3>
            <p data-r>{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
