"use client";

import * as React from "react";
import Link from "next/link";
import { useReveal } from "@/components/motion/reveal";
import { Arrow } from "@/components/ui/arrow";

/** Every page ends at one action: a dark band with Astrum's own line and the way to the conversation. */
export function CtaBand({ line = "Eerst praten. Dan pas kiezen.", topic }: { line?: string; topic?: string }) {
  const root = React.useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="cta-band page-x" aria-labelledby="cta-title">
      <div className="cta-inner" data-r-block>
        <h2 id="cta-title" data-r-title>
          {line}
        </h2>
        <div className="cta-side" data-r>
          <p>Vertel kort waar je staat. We nemen contact op voor een vrijblijvend gesprek, op een moment dat jou past.</p>
          <Link href={topic ? `/contact/?onderwerp=${encodeURIComponent(topic)}` : "/contact/"} className="btn btn-light" data-magnetic>
            Plan een gesprek <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
