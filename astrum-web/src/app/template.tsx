"use client";

import * as React from "react";

// Set after the first page has shown: the opening load has the home hero's own intro (or simply the page), and only
// later navigations get the curtain.
let navigated = false;

// Re-mounts on every navigation, so the curtain plays as a page transition.
// Pure CSS: it never leaves the page covered, even without JavaScript, and is off under reduced motion.
export default function Template({ children }: { children: React.ReactNode }) {
  const [curtain] = React.useState(() => navigated);
  React.useEffect(() => {
    navigated = true;
  }, []);
  return (
    <>
      {curtain && (
        <div className="page-curtain" aria-hidden="true">
          <span translate="no">Astrum</span>
        </div>
      )}
      {children}
    </>
  );
}
