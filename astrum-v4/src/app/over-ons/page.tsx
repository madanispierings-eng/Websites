import type { Metadata } from "next";
import { Statement } from "@/components/home/statement";
import { Team } from "@/components/home/team";
import { CtaBand } from "@/components/page/cta-band";

export const metadata: Metadata = {
  title: "Over Astrum",
  description: "De mensen achter Astrum: Pim Verberg, Denise Birjmohun en Ron Veen. Eén vast aanspreekpunt, in het Nederlands.",
};

export default function OverOnsPage() {
  return (
    <div className="page-top">
      <Team heading="h1" />
      <Statement />
      <CtaBand />
    </div>
  );
}
