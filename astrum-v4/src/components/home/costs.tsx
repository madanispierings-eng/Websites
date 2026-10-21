"use client";

import * as React from "react";
import gsap from "gsap";
import Link from "next/link";
import { useReveal } from "@/components/motion/reveal";
import { site } from "@/lib/content";
import { GOLDEN_VISA_THRESHOLD, type Mode, aed, eur, formatNumber, parseNumber, purchaseCosts } from "@/lib/costs";

const MIN = 500_000;
const MAX = 10_000_000;

const modes: { value: Mode; label: string; text: string }[] = [
  { value: "ready", label: "Bestaande woning", text: "Een woning die al af is. Je betaalt bij de overdracht in één keer." },
  { value: "offplan", label: "Off-plan", text: "Kopen bij de ontwikkelaar, vóór oplevering. Je betaalt in termijnen; de bijkomende kosten zijn lager." },
  { value: "mortgage", label: "Met hypotheek", text: "Een bestaande woning met een hypotheek van een bank in de Emiraten. De bank vraagt eigen kosten." },
];
const ltvs = ["0.5", "0.6", "0.75"];

/**
 * The one live thing: choose how you buy and a price, and read what comes on top of it, line by line, with the total
 * set large and counting to its new value. Plain controls, so it works with a thumb and without script styling.
 */
export function Costs({ heading: Heading = "h2" }: { heading?: "h1" | "h2" }) {
  const root = React.useRef<HTMLElement>(null);
  const totalRef = React.useRef<HTMLSpanElement>(null);
  const shownTotal = React.useRef<number | null>(null);
  const [mode, setMode] = React.useState<Mode>("ready");
  const [price, setPrice] = React.useState(1_800_000);
  const [priceText, setPriceText] = React.useState(formatNumber(1_800_000));
  const [ltv, setLtv] = React.useState("0.5");
  const [rateText, setRateText] = React.useState("4,25");
  const id = React.useId();
  useReveal(root);

  const lines = purchaseCosts(price, mode, Number(ltv));
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const rate = parseNumber(rateText) || 4.25;
  const current = modes.find((m) => m.value === mode)!;

  // The big figure counts to its new value instead of jumping.
  React.useEffect(() => {
    const el = totalRef.current;
    if (!el) return;
    const from = shownTotal.current ?? total;
    shownTotal.current = total;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || from === total) {
      el.textContent = formatNumber(total);
      return;
    }
    const v = { n: from };
    const t = gsap.to(v, { n: total, duration: 0.8, ease: "expo.out", onUpdate: () => void (el.textContent = formatNumber(v.n)) });
    return () => void t.kill();
  }, [total]);

  const summary =
    `${current.label}, koopprijs ${aed(price)}\n` +
    lines.map((l) => `- ${l.name}: ${aed(l.amount)}`).join("\n") +
    `\nTotaal bovenop de koopprijs: ${aed(total)}`;

  return (
    <section ref={root} className="costs" aria-labelledby="costs-title">
      <div className="costs-grid grid-12 page-x">
        <div className="costs-intro" data-r-block>
          <Heading id="costs-title" data-r-title>
            Wat kopen echt kost
          </Heading>
          <p data-r>
            Overdrachtsbelasting, de trustee, de makelaar en de bank. Kies een prijs en zie wat er bovenop komt, voordat
            iemand je een brochure laat zien.
          </p>
          <p className="costs-total" data-r aria-live="polite">
            <span className="costs-total-label">Bovenop de koopprijs</span>
            <span className="costs-total-figure">
              AED <span ref={totalRef}>{formatNumber(total)}</span>
            </span>
            <span className="costs-total-eur">ongeveer {eur(total / rate)}</span>
          </p>
        </div>

        <div className="costs-panel" data-r-block>
          <fieldset className="seg" data-r>
            <legend className="sr-only">Soort aankoop</legend>
            {modes.map((m) => (
              <label key={m.value}>
                <input type="radio" name={`${id}-mode`} value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} />
                <span>{m.label}</span>
              </label>
            ))}
          </fieldset>
          <p className="costs-mode-text" data-r>
            {current.text}
            {mode === "mortgage" && ` Eigen inbreng: ${aed(price * (1 - Number(ltv)))} plus de kosten hieronder.`}
          </p>

          <div className="costs-price" data-r>
            <label htmlFor={`${id}-price`}>Koopprijs in AED</label>
            <input
              id={`${id}-price`}
              className="costs-input"
              inputMode="numeric"
              value={priceText}
              onChange={(e) => {
                setPriceText(e.target.value);
                setPrice(Math.min(parseNumber(e.target.value), 1e9));
              }}
              onBlur={() => setPriceText(formatNumber(price))}
              aria-describedby={`${id}-hint`}
            />
            <input
              type="range"
              className="costs-range"
              min={MIN}
              max={MAX}
              step={50_000}
              value={Math.min(Math.max(price, MIN), MAX)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPrice(v);
                setPriceText(formatNumber(v));
              }}
              aria-label="Koopprijs schuiven"
              style={{ "--fill": `${((Math.min(Math.max(price, MIN), MAX) - MIN) / (MAX - MIN)) * 100}%` } as React.CSSProperties}
            />
            <p id={`${id}-hint`} className="costs-hint">Van AED 500.000 tot 10 miljoen. Typ gerust een ander bedrag.</p>
          </div>

          {mode === "mortgage" && (
            <fieldset className="seg seg-small">
              <legend>Hypotheek, deel van de koopprijs</legend>
              {ltvs.map((v) => (
                <label key={v}>
                  <input type="radio" name={`${id}-ltv`} value={v} checked={ltv === v} onChange={() => setLtv(v)} />
                  <span>{Math.round(Number(v) * 100)}%</span>
                </label>
              ))}
            </fieldset>
          )}

          <table className="costs-table" data-r>
            <caption className="sr-only">Bijkomende kosten bij aankoop</caption>
            <tbody>
              {lines.map((l) => (
                <tr key={l.name}>
                  <th scope="row">
                    {l.name}
                    <span>{l.note}</span>
                  </th>
                  <td>{aed(l.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Totaal</th>
                <td>{aed(total)}</td>
              </tr>
              <tr className="costs-rate">
                <th scope="row">
                  <label htmlFor={`${id}-rate`}>In euro, bij </label>
                  <input id={`${id}-rate`} inputMode="decimal" value={rateText} onChange={(e) => setRateText(e.target.value)} aria-label="Koers, AED per euro" />{" "}
                  AED per euro
                </th>
                <td>{eur(total / rate)}</td>
              </tr>
            </tfoot>
          </table>

          {price >= GOLDEN_VISA_THRESHOLD && (
            <p className="costs-visa">Vanaf AED 2 miljoen kom je in aanmerking voor het Golden Visa van tien jaar.</p>
          )}
          <p className="costs-hint">Indicatief, op basis van de gangbare tarieven in Dubai. Voor jouw aankoop rekenen we het tot op de dirham na.</p>

          <div className="costs-actions">
            <Link
              className="btn"
              href="/contact/?onderwerp=Kopen"
              onClick={() => {
                try {
                  sessionStorage.setItem("astrum-bericht", summary);
                } catch {}
              }}
              data-magnetic
            >
              Bespreek jouw cijfers
            </Link>
            <a
              className="link-draw"
              href={`mailto:?subject=${encodeURIComponent("Kosten kopen in Dubai")}&body=${encodeURIComponent(summary + `\n\nIndicatief, berekend op ${site.url.replace("https://", "")}`)}`}
            >
              Mail mij dit overzicht
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
