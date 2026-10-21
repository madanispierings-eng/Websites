import type { Metadata } from "next";
import { Faq } from "@/components/home/faq";
import { CtaBand } from "@/components/page/cta-band";
import { PageHero } from "@/components/page/page-hero";
import { TextBlocks } from "@/components/page/text-blocks";
import { pages, services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Advies en portfolio",
  description: "Eerst kijken of Dubai bij jouw plan past, ook als het antwoord nee is. Daarna, als je wilt, een portfolio voor nu en later.",
};

export default function AdviesPage() {
  return (
    <>
      <PageHero title={pages.advies.title} intro={pages.advies.intro} photo={services[2].main} action={{ href: "/contact/?onderwerp=Advies", label: "Plan een gesprek" }} />
      <TextBlocks blocks={pages.advies.blocks} />
      <Faq title="Vragen over Dubai" topics={["Visum en wonen", "Op afstand"]} />
      <CtaBand topic="Advies" />
    </>
  );
}
