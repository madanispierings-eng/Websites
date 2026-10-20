import { Areas } from "@/components/home/areas";
import { Contact } from "@/components/home/contact";
import { Costs } from "@/components/home/costs";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { Process } from "@/components/home/process";
import { Showcase } from "@/components/home/showcase";
import { Statement } from "@/components/home/statement";
import { Team } from "@/components/home/team";

export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <Showcase />
      <Areas />
      <Process />
      <Costs />
      <Team />
      <Faq />
      <Contact />
    </>
  );
}
