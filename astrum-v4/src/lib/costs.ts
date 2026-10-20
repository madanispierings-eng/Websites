// Gangbare bijkomende kosten bij aankoop in Dubai. Indicatief; Astrum bevestigt de bedragen per aankoop.
export type Mode = "ready" | "offplan" | "mortgage";

export type CostLine = { name: string; note: string; amount: number; explain: string };

const VAT = 0.05;

export function purchaseCosts(price: number, mode: Mode, ltv = 0.5): CostLine[] {
  const lines: CostLine[] = [
    {
      name: "Overdrachtsbelasting DLD",
      note: "4% van de koopprijs",
      amount: price * 0.04,
      explain: "Het Dubai Land Department registreert de eigendom. Dit is verreweg de grootste post.",
    },
  ];
  if (mode === "offplan") {
    lines.push({
      name: "Registratie bij de ontwikkelaar (Oqood)",
      note: "vast bedrag",
      amount: 1150,
      explain: "Bij off-plan wordt je koop voorlopig geregistreerd in Oqood, tot de woning is opgeleverd.",
    });
    return lines;
  }
  lines.push(
    {
      name: "Administratie DLD en eigendomsakte",
      note: "vast bedrag",
      amount: 580,
      explain: "De kosten voor de nieuwe eigendomsakte op jouw naam.",
    },
    {
      name: "Trustee-kantoor",
      note: "vast bedrag, incl. btw",
      amount: (price >= 500000 ? 4000 : 2000) * (1 + VAT),
      explain: "Bij een erkend trustee-kantoor vindt de overdracht plaats, met koper, verkoper en DLD.",
    },
    {
      name: "Makelaarscourtage",
      note: "2% + 5% btw",
      amount: price * 0.02 * (1 + VAT),
      explain: "Het gangbare tarief bij een bestaande woning. Bij off-plan betaalt meestal de ontwikkelaar.",
    },
  );
  if (mode === "mortgage") {
    const loan = price * ltv;
    lines.push(
      {
        name: "Hypotheekregistratie DLD",
        note: "0,25% van de lening",
        amount: loan * 0.0025 + 290,
        explain: "De bank laat de hypotheek inschrijven bij het Dubai Land Department.",
      },
      {
        name: "Taxatie door de bank",
        note: "ongeveer",
        amount: 3000 * (1 + VAT),
        explain: "De bank laat de woning taxeren voordat de lening definitief is.",
      },
      {
        name: "Afsluitkosten bank",
        note: "tot 1% van de lening",
        amount: loan * 0.01,
        explain: "Verschilt per bank; soms is het lager of vervalt het.",
      },
    );
  }
  return lines;
}

export const GOLDEN_VISA_THRESHOLD = 2_000_000;

const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });
export const formatNumber = (n: number) => nf.format(Math.round(n));
export const aed = (n: number) => `AED ${formatNumber(n)}`;
export const eur = (n: number) => `€ ${formatNumber(n)}`;
export const parseNumber = (s: string) => Number(String(s).replace(/[^\d,]/g, "").replace(",", ".")) || 0;
