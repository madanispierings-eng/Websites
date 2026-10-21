import type { Metadata } from "next";
import { Contact } from "@/components/home/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Plan een vrijblijvend gesprek met Astrum, of meld je aan voor de Astrum Private List.",
};

export default function ContactPage() {
  return (
    <div className="page-top">
      <Contact heading="h1" />
    </div>
  );
}
