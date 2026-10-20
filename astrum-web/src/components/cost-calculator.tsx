"use client";

import * as React from "react";
import Link from "next/link";
import { useBooking } from "@/components/booking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GOLDEN_VISA_THRESHOLD, type Mode, aed, eur, formatNumber, parseNumber, purchaseCosts } from "@/lib/costs";

const MIN = 500_000;
const MAX = 10_000_000;

const modes: { value: Mode; label: string; text: string }[] = [
  { value: "ready", label: "Bestaande woning", text: "Een woning die al af is. Je betaalt bij de overdracht in één keer." },
  { value: "offplan", label: "Off-plan", text: "Kopen bij de ontwikkelaar, vóór oplevering. Je betaalt in termijnen; de bijkomende kosten zijn lager." },
  { value: "mortgage", label: "Met hypotheek", text: "Een bestaande woning met een hypotheek van een bank in de Emiraten. De bank vraagt eigen kosten." },
];

export function CostCalculator({ explain = false }: { explain?: boolean }) {
  const { openBooking } = useBooking();
  const [mode, setMode] = React.useState<Mode>("ready");
  const [price, setPrice] = React.useState(1_800_000);
  const [priceText, setPriceText] = React.useState(formatNumber(1_800_000));
  const [ltv, setLtv] = React.useState("0.5");
  const [rateText, setRateText] = React.useState("4,25");
  const id = React.useId();

  const lines = purchaseCosts(price, mode, Number(ltv));
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const rate = parseNumber(rateText) || 4.25;
  const current = modes.find((m) => m.value === mode)!;

  const summary = () =>
    `${current.label}, koopprijs ${aed(price)}\n` +
    lines.map((l) => `- ${l.name}: ${aed(l.amount)}`).join("\n") +
    `\nTotaal bovenop de koopprijs: ${aed(total)}`;

  return (
    <div className="grid gap-8">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList variant="line" aria-label="Soort aankoop" className="h-auto flex-wrap justify-start gap-x-6 gap-y-1 p-0 group-data-horizontal/tabs:h-auto">
          {modes.map((m) => (
            <TabsTrigger
              key={m.value}
              value={m.value}
              className="h-11 flex-none px-0 text-body font-normal text-stone data-[state=active]:font-medium data-[state=active]:text-ink"
            >
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="measure" aria-live="polite">
        {current.text}
        {mode === "mortgage" && ` Eigen inbreng: ${aed(price * (1 - Number(ltv)))} plus de kosten hieronder.`}
      </p>

      <div className="grid gap-4">
        <Label htmlFor={`${id}-price`} className="text-small font-normal">Koopprijs in AED</Label>
        <Input
          id={`${id}-price`}
          inputMode="numeric"
          value={priceText}
          onChange={(e) => {
            setPriceText(e.target.value);
            setPrice(Math.min(parseNumber(e.target.value), 1e9));
          }}
          onBlur={() => setPriceText(formatNumber(price))}
          aria-describedby={`${id}-hint`}
          className="h-14 text-lead tabular-nums"
        />
        <Slider
          min={MIN}
          max={MAX}
          step={50_000}
          value={[Math.min(Math.max(price, MIN), MAX)]}
          onValueChange={([v]) => {
            setPrice(v);
            setPriceText(formatNumber(v));
          }}
          aria-label="Koopprijs schuiven"
          className="py-3"
        />
        <p id={`${id}-hint`} className="text-small text-stone">Van AED 500.000 tot 10 miljoen. Typ gerust een ander bedrag.</p>
      </div>

      {mode === "mortgage" && (
        <div className="grid max-w-xs gap-2">
          <Label htmlFor={`${id}-ltv`} className="text-small font-normal">Hypotheek, deel van de koopprijs</Label>
          <Select value={ltv} onValueChange={setLtv}>
            <SelectTrigger id={`${id}-ltv`} className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">50%</SelectItem>
              <SelectItem value="0.6">60%</SelectItem>
              <SelectItem value="0.75">75%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <table className="w-full border-collapse tabular-nums">
        <caption className="sr-only">Bijkomende kosten bij aankoop</caption>
        <tbody>
          {lines.map((l) => (
            <tr key={l.name} /* taste-skill-ignore: real table */ className="border-b border-tone align-baseline">
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                {l.name}
                <span className="block text-small text-stone">{l.note}</span>
                {explain && <span className="measure mt-1 block text-small text-stone">{l.explain}</span>}
              </th>
              <td className="py-3 text-right whitespace-nowrap">{aed(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="align-baseline">
            <th scope="row" className="pt-5 text-left text-lead font-medium">Totaal bovenop de koopprijs</th>
            <td className="pt-5 text-right text-lead font-medium whitespace-nowrap">{aed(total)}</td>
          </tr>
          <tr className="align-baseline text-stone">
            <th scope="row" className="pt-3 text-left font-normal">
              <label htmlFor={`${id}-rate`}>In euro, bij </label>
              <Input
                id={`${id}-rate`}
                inputMode="decimal"
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
                className="mx-1 inline-flex h-10 w-20 text-center"
                aria-label="Koers, AED per euro"
              />{" "}
              AED per euro
            </th>
            <td className="pt-3 text-right whitespace-nowrap">{eur(total / rate)}</td>
          </tr>
        </tfoot>
      </table>

      {price >= GOLDEN_VISA_THRESHOLD && (
        <p className="bg-gold-light p-4">
          Vanaf AED 2 miljoen kom je in aanmerking voor het Golden Visa van tien jaar.{" "}
          <Link href="/vragen/" className="link">Meer over visum en wonen</Link>
        </p>
      )}
      <p className="text-small text-stone">
        Indicatief, op basis van de gangbare tarieven in Dubai. Voor jouw aankoop rekenen we het tot op de dirham na.
      </p>

      <div className="grid sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openBooking({ topic: "Kopen", message: summary() })}
          className="flex min-h-[72px] items-center justify-center bg-ink px-4 font-medium text-paper transition-colors hover:bg-creek"
        >
          Bespreek jouw cijfers
        </button>
        <a
          href={`mailto:?subject=${encodeURIComponent("Kosten kopen in Dubai")}&body=${encodeURIComponent(summary() + "\n\nIndicatief, berekend op astrumuae.com")}`}
          className="flex min-h-[72px] items-center justify-center bg-tone px-4 font-medium transition-colors hover:bg-gold-light"
        >
          Mail mij dit overzicht
        </a>
      </div>
    </div>
  );
}
