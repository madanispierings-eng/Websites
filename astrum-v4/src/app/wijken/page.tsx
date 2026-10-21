import type { Metadata } from "next";
import { Areas } from "@/components/home/areas";
import { CtaBand } from "@/components/page/cta-band";

export const metadata: Metadata = {
  title: "Wijken in Dubai",
  description: "Palm Jumeirah, Dubai Marina, Jumeirah, Downtown en Creek Harbour: wat je er vindt en wat goed is om te weten.",
};

export default function WijkenPage() {
  return (
    <div className="page-top">
      <Areas details heading="h1" />
      <CtaBand line="Welke wijk past bij jou?" />
    </div>
  );
}
