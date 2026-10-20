import type { Metadata } from "next";
import Image from "next/image";
import { ContactFields } from "@/components/contact-form";
import { LoopVideo } from "@/components/loop-video";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Plan een vrijblijvend gesprek met Astrum, boutique makelaar in Dubai voor Nederlanders. In het Nederlands, ter plekke of via video.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <section className="container-page grid gap-16 pt-16 pb-24 lg:grid-cols-12 lg:gap-5 lg:pt-24 lg:pb-32" data-reveal>
      <div className="grid content-start gap-8 lg:col-span-6 lg:row-span-2">
        <h1 className="text-head" data-r>Eerst praten. Dan pas kiezen.</h1>
        <p className="measure text-lead" data-r>
          Vertel kort waar je staat. We nemen contact op voor een vrijblijvend gesprek, op een moment dat jou past.
        </p>
        <div className="bg-paper p-6 sm:p-10" data-r>
          <ContactFields />
        </div>
      </div>
      <aside className="grid content-start gap-8 lg:col-span-5 lg:col-start-8" aria-label="Direct contact" data-r>
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image src="/img/duo.jpg" alt="Pim Verberg en Denise Birjmohun van Astrum" fill priority sizes="(min-width:1024px) 30vw, 100vw" className="object-cover object-[50%_25%]" />
        </div>
        <div className="grid grid-cols-[120px_1fr] items-start gap-5">
          <Image src="/img/pim-face.jpg" alt="Pim Verberg" width={240} height={240} className="aspect-square w-full object-cover" />
          <div className="grid gap-2">
          <p className="text-lead font-medium">Liever direct?</p>
          <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="link" href={site.instagram} rel="noopener">Instagram @astrumuae</a>
          <a className="link" href={site.linkedin} rel="noopener">LinkedIn</a>
          <p className="mt-2 text-small text-stone">{site.city}. We reageren binnen één werkdag.</p>
          </div>
        </div>
      </aside>
      <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:col-start-8" data-r>
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image src="/img/skyline.jpg" alt="De skyline van Dubai in de avondzon" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover object-[86%_50%]" data-drift />
        </div>
        <LoopVideo className="aspect-[16/9] w-full object-cover" src="/video/creek.mp4" poster="/img/creek-poster.jpg" label="Meeuwen boven de Dubai Creek" />
        <div className="relative aspect-[16/9] overflow-hidden sm:col-span-2">
          <Image src="/img/marina.jpg" alt="Dubai Marina bij nacht" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" data-drift />
        </div>
      </div>
    </section>
  );
}
