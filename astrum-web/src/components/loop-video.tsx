"use client";

import * as React from "react";

/**
 * A muted loop that plays only while visible, never under prefers-reduced-motion (the poster stays),
 * and can be paused (WCAG 2.2.2: moving content longer than five seconds needs a pause control).
 */
export function LoopVideo({ src, poster, label, className }: { src: string; poster: string; label: string; className?: string }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    setReduced(matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  React.useEffect(() => {
    const video = ref.current;
    if (!video || reduced || paused) {
      video?.pause();
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(video);
    return () => io.disconnect();
  }, [reduced, paused]);

  return (
    <div className="relative">
      <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} />
      {!reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="absolute bottom-3 left-3 min-h-11 bg-ink px-4 text-small text-paper transition-colors hover:bg-creek"
        >
          {paused ? "Film afspelen" : "Film pauzeren"}
        </button>
      )}
    </div>
  );
}
