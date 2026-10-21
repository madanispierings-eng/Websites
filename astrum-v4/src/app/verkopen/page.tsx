import type { Metadata } from "next";
import { Faq } from "@/components/home/faq";
import { CtaBand } from "@/components/page/cta-band";
import { PageHero } from "@/components/page/page-hero";
import { Steps } from "@/components/page/steps";
import { pages, services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Verkopen in Dubai",
  description: "Je woning in Dubai verkopen voor een vraagprijs op basis van wat er echt betaald is, met één aanspreekpunt tot de overdracht.",
};

export default function VerkopenPage() {
  return (
    <>
      <PageHero title={pages.verkopen.title} intro={pages.verkopen.intro} photo={services[1].main} action={{ href: "/contact/?onderwerp=Verkopen", label: "Plan een gesprek" }} />
      <Steps title="Zo verkopen we" intro="Vier stappen, van een eerlijke prijs tot de overdracht. Jij weet steeds waar je staat." steps={pages.verkopen.steps} />
      <Faq title="Vragen over verkopen" topics={["Verkopen", "Visum en wonen"]} />
      <CtaBand topic="Verkopen" />
    </>
  );
}
