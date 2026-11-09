/**
 * A subtle, repeating watermark with the signed-in user's identity, laid over premium content.
 * It deters screenshotting and sharing: any capture carries the account it came from. Rendered as a
 * fixed, non-interactive layer so it stays in view while scrolling. Keep it faint for readability.
 */
export function ContentWatermark({ label }: { label: string }) {
  const esc = label.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='210'>` +
    `<text x='18' y='120' transform='rotate(-26 180 105)' font-family='Inter, system-ui, sans-serif' ` +
    `font-size='13' font-weight='600' fill='#0b2345' fill-opacity='0.055'>${esc}</text></svg>`;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] select-none"
      style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundRepeat: "repeat" }}
    />
  );
}
