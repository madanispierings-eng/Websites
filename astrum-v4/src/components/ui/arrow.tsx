/** Two arrows in one window: on hover the first slides out and the second slides in behind it. */
export function Arrow() {
  const path = <path d="M1 8h13M9 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  return (
    <span className="arrow" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="16" height="16">{path}</svg>
      <svg viewBox="0 0 16 16" width="16" height="16">{path}</svg>
    </span>
  );
}
