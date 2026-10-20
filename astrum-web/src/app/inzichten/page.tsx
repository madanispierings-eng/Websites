import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/sections";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Inzichten uit de markt van Dubai",
  description: "Artikelen over vastgoed in Dubai, zonder verkooppraat: transactieprijzen, gebieden en off-plan contracten.",
  alternates: { canonical: "/inzichten/" },
};

export default function InzichtenPage() {
  const [first, ...rest] = articles;
  return (
    <>
      <section className="container-page pt-16 pb-16 lg:pt-24" data-reveal>
        <h1 className="text-head" data-r>Inzichten uit de markt</h1>
        <p className="measure mt-8 text-lead" data-r>Wat we zien in Dubai, zonder verkooppraat. Ook de dingen die je liever vooraf weet.</p>
      </section>

      <section className="container-page pb-24 lg:pb-32" aria-label="Artikelen" data-reveal>
        <Link href={`/inzichten/${first.slug}/`} className="group grid gap-8 bg-paper lg:grid-cols-12 lg:gap-5" data-r>
          <div className="relative aspect-[16/10] overflow-hidden lg:col-span-6 xl:col-span-7">
            <Image src={first.image.src} alt={first.image.alt} fill priority sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" data-drift />
          </div>
          <div className="grid min-w-0 content-end gap-4 p-6 lg:col-span-6 lg:p-10 xl:col-span-5">
            <h2 className="text-head group-hover:text-creek">{first.title}</h2>
            <p className="measure text-lead">{first.dek}</p>
            <p className="text-small text-stone">{first.topic}, {first.minutes} min lezen</p>
          </div>
        </Link>

        <ul className="mt-5 grid gap-5 md:grid-cols-2">
          {rest.map((a) => (
            <li key={a.slug} data-r>
              <Link href={`/inzichten/${a.slug}/`} className="group grid h-full content-start gap-4">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={a.image.src} alt={a.image.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" data-drift />
                </div>
                <h2 className="text-lead font-medium group-hover:text-creek">{a.title}</h2>
                <p className="text-stone">{a.dek}</p>
                <p className="text-small text-stone">{a.topic}, {a.minutes} min lezen</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand line="Liever het gesprek dan het artikel?" />
    </>
  );
}
