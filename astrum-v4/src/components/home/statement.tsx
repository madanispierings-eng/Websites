"use client";

import * as React from "react";
import gsap from "gsap";
import { useReveal } from "@/components/motion/reveal";
import { statement } from "@/lib/content";

/**
 * Astrum's own sentence, set large; while it crosses the screen each word lights from pale to full ink, so it reads
 * at the pace of the scroll. Under it the three promises in plain words.
 */
export function Statement() {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root, (el) => {
    const words = el.querySelectorAll("[data-word]");
    const tween = gsap.fromTo(
      words,
      { opacity: 0.16 },
      { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el.querySelector(".statement-text"), start: "top 78%", end: "bottom 42%", scrub: true } },
    );
    return () => tween.scrollTrigger?.kill();
  });

  return (
    <section ref={root} className="statement page-x" aria-labelledby="statement-title">
      <h2 id="statement-title" className="sr-only">Waar Astrum voor staat</h2>
      <p className="statement-text">
        {statement.text.split(" ").map((w, i) => (
          <span key={i} data-word>
            {w}{" "}
          </span>
        ))}
      </p>
      <ul className="statement-usps" data-r-block>
        {statement.usps.map((u) => (
          <li key={u} data-r>
            {u}
          </li>
        ))}
      </ul>
    </section>
  );
}
