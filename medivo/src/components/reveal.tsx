"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A short fade-and-rise on first paint, for hero content only. Under reduced motion it resolves instantly.
 * The element and its initial style stay identical on server and client: swapping in a plain <div> when
 * the media query matches caused a hydration mismatch that left the server's `opacity: 0` in place.
 */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
