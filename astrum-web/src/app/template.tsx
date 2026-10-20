// Re-mounts on every navigation, so the curtain plays as a page transition.
// Pure CSS: it never leaves the page covered, even without JavaScript, and is off under reduced motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="page-curtain" aria-hidden="true">
        <span translate="no">Astrum</span>
      </div>
      {children}
    </>
  );
}
