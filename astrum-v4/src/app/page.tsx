import { Areas } from "@/components/home/areas";
import { Hero } from "@/components/home/hero";
import { Showcase } from "@/components/home/showcase";
import { Statement } from "@/components/home/statement";
import { CtaBand } from "@/components/page/cta-band";
import { CostsTeaser } from "@/components/page/costs-teaser";

export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <Showcase />
      <Areas link />
      <CostsTeaser />
      <CtaBand />
    </>
  );
}
