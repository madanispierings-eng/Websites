import type { Metadata } from "next";
import { Faq } from "@/components/home/faq";
import { Process } from "@/components/home/process";
import { CtaBand } from "@/components/page/cta-band";
import { PageHero } from "@/components/page/page-hero";
import { TextBlocks } from "@/components/page/text-blocks";
import { pages, services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Kopen in Dubai",
  description: "Een woning kopen in Dubai, bestaand of off-plan, getoetst aan echte transactieprijzen en begeleid tot de overdracht.",
};

export default function KopenPage() {
  return (
    <>
      <PageHero title={pages.kopen.title} intro={pages.kopen.intro} photo={services[0].main} action={{ href: "/contact/?onderwerp=Kopen", label: "Plan een gesprek" }} />
      <TextBlocks title="Bestaand of off-plan?" blocks={pages.kopen.kinds} />
      <Process />
      <Faq title="Vragen over kopen" topics={["Kopen", "Kosten"]} />
      <CtaBand topic="Kopen" />
    </>
  );
}
