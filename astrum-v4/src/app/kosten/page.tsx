import type { Metadata } from "next";
import { Costs } from "@/components/home/costs";
import { Faq } from "@/components/home/faq";
import { CtaBand } from "@/components/page/cta-band";
import { CostLines } from "@/components/page/cost-lines";

export const metadata: Metadata = {
  title: "Wat kopen in Dubai echt kost",
  description: "Reken uit wat er bovenop de koopprijs komt: overdrachtsbelasting, trustee, makelaar en bank. Met elke kostenpost uitgelegd.",
};

export default function KostenPage() {
  return (
    <div className="page-top">
      <Costs heading="h1" />
      <CostLines />
      <Faq title="Vragen over kosten" topics={["Kosten", "Visum en wonen"]} />
      <CtaBand topic="Kopen" />
    </div>
  );
}
