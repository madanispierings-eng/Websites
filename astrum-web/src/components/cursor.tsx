"use client";

import * as React from "react";
import gsap from "gsap";

const INTERACTIVE = "a, button, [role='button'], label, summary, select";
const PULL = 0.3;
const MAX_PULL = 8;

/**
 * An 8px dot on the pointer and a ring that trails it. Over links and buttons the ring widens; over an element with
 * data-cursor="Bekijk" (or any word) it becomes an 88px champagne disc with that word. Elements with data-magnetic lean
 * up to 8px towards the pointer. Only with a fine pointer and motion allowed; otherwise the system cursor stays.
 */
export function Cursor() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [label, setLabel] = React.useState("");

  React.useEffect(() => {
    const el = ref.current;
    const query = matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!el || !query.matches) return;
    const html = document.documentElement;
    const dot = el.querySelector<HTMLElement>(".cursor-dot")!;
    const ring = el.querySelector<HTMLElement>(".cursor-ring")!;
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    let magnet: { el: HTMLElement; x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null = null;
    let shown = false;

    const release = () => {
      if (!magnet) return;
      magnet.x(0);
      magnet.y(0);
      magnet = null;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        // First move: start where the pointer is instead of flying in from the corner.
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        html.classList.add("has-cursor");
        shown = true;
      }
      el.dataset.hidden = "false";
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      if (magnet) {
        const r = magnet.el.getBoundingClientRect();
        const clamp = gsap.utils.clamp(-MAX_PULL, MAX_PULL);
        magnet.x(clamp((e.clientX - (r.left + r.width / 2)) * PULL));
        magnet.y(clamp((e.clientY - (r.top + r.height / 2)) * PULL));
      }
    };

    const over = (e: PointerEvent) => {
      const target = e.target as Element;
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      if (labelled) {
        setLabel(labelled.dataset.cursor ?? "");
        el.dataset.state = "label";
      } else {
        el.dataset.state = target.closest(INTERACTIVE) ? "hover" : "";
      }
      const m = target.closest<HTMLElement>("[data-magnetic]");
      if (m !== magnet?.el) {
        release();
        if (m) magnet = { el: m, x: gsap.quickTo(m, "x", { duration: 0.5, ease: "power3" }), y: gsap.quickTo(m, "y", { duration: 0.5, ease: "power3" }) };
      }
    };

    const leave = () => {
      el.dataset.hidden = "true";
      release();
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      release();
      html.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true" data-hidden="true">
      <div className="cursor-ring">
        <span>{label}</span>
      </div>
      <div className="cursor-dot" />
    </div>
  );
}
