import Image from "next/image";
import Link from "next/link";
import { BookingButton } from "@/components/booking";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Faq } from "@/lib/faq";
import { cn } from "@/lib/utils";

export function PageIntro({
  title,
  intro,
  image,
  children,
}: {
  title: string;
  intro: string;
  image?: { src: string; alt: string; width: number; height: number; position?: string };
  children?: React.ReactNode;
}) {
  return (
    <section className="container-page grid gap-10 pt-16 pb-20 lg:grid-cols-12 lg:items-center lg:gap-5 lg:pt-24 lg:pb-32" data-reveal>
      <div className={cn("grid content-start gap-8", image ? "lg:col-span-5" : "lg:col-span-8")}>
        <h1 className="text-head max-w-[14ch]" data-r>{title}</h1>
        <p className="measure text-lead" data-r>{intro}</p>
        {children && <div data-r>{children}</div>}
      </div>
      {image && (
        <div className="overflow-hidden lg:col-span-6 lg:col-start-7" data-r>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority
            className="aspect-[4/5] w-full object-cover"
            style={{ objectPosition: image.position ?? "50% 50%" }}
            data-drift
          />
        </div>
      )}
    </section>
  );
}

/** A printed price list: name, dotted leader, value, and a short line under it. */
export function PriceList({
  title,
  intro,
  groups,
  className,
}: {
  title: string;
  intro?: string;
  groups: { name: string; href?: string; rows: { name: string; value: string; note?: string }[] }[];
  className?: string;
}) {
  return (
    <div className={cn("zigzag-y bg-paper px-6 py-16 text-ink sm:px-12", className)} data-r>
      <h2 className="text-head text-center">{title}</h2>
      {intro && <p className="mx-auto mt-4 max-w-[36ch] text-center text-stone">{intro}</p>}
      <div className="mt-12 grid gap-11">
        {groups.map((g) => (
          <div key={g.name}>
            <h3 className="mb-4 text-lead font-medium">
              {g.href ? (
                <Link href={g.href} className="link decoration-transparent hover:decoration-current">
                  {g.name}
                </Link>
              ) : (
                g.name
              )}
            </h3>
            <dl className="grid gap-4">
              {g.rows.map((r) => (
                <div key={r.name} className="leader-row">
                  <dt>{r.name}</dt>
                  <dd className="text-stone">{r.value}</dd>
                  {r.note && <p className="mt-1 max-w-[40ch] text-small text-stone">{r.note}</p>}
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Steps({
  title,
  intro,
  steps,
  image,
}: {
  title: string;
  intro?: string;
  steps: { name: string; text: string; detail?: string[] }[];
  image?: { src: string; alt: string; position?: string };
}) {
  return (
    <section className="container-page grid gap-12 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32" data-reveal>
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <h2 className="text-head" data-r>{title}</h2>
          {intro && <p className="mt-6 max-w-[34ch] text-stone" data-r>{intro}</p>}
          {image && (
            <div className="relative mt-10 hidden aspect-[4/5] overflow-hidden lg:block" data-r>
              <Image src={image.src} alt={image.alt} fill sizes="30vw" className="object-cover" style={{ objectPosition: image.position ?? "50% 50%" }} />
            </div>
          )}
        </div>
      </div>
      <ol className="grid content-start gap-12 lg:col-span-7 lg:col-start-6">
        {steps.map((s, i) => (
          <li key={s.name} className="grid gap-x-8 gap-y-3 sm:grid-cols-[4rem_1fr]" data-r>
            <span className="hidden text-head leading-none text-stone tabular-nums sm:block" aria-hidden="true">{i + 1}</span>
            <div className="grid gap-3">
              <h3 className="text-lead font-medium">{s.name}</h3>
              <p className="measure">{s.text}</p>
              {s.detail && (
                <ul className="grid list-disc gap-1 pl-5 text-stone marker:text-gold">
                  {s.detail.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The same steps as a row of cards that travels sideways while the section is pinned (desktop, with motion).
 * Without motion or on smaller screens the cards simply stack.
 */
export function StepsTravel({
  title,
  intro,
  steps,
  image,
}: {
  title: string;
  intro?: string;
  steps: { name: string; text: string; detail?: string[] }[];
  image?: { src: string; alt: string; position?: string };
}) {
  return (
    <section className="group/h overflow-hidden py-24 data-[h=true]:py-0 lg:py-32" data-hscroll data-reveal>
      <div className="flex min-h-0 flex-col justify-center group-data-[h=true]/h:min-h-svh">
        <div className="container-page grid gap-6 lg:grid-cols-12 lg:gap-5">
          <h2 className="text-head lg:col-span-6" data-r>{title}</h2>
          {intro && <p className="max-w-[34ch] self-end text-stone lg:col-span-4 lg:col-start-9" data-r>{intro}</p>}
        </div>
        <div className="container-page mt-12">
          <ol className="grid gap-5 sm:grid-cols-2 group-data-[h=true]/h:flex group-data-[h=true]/h:w-max" data-hscroll-track>
            {image && (
              <li aria-hidden="true" className="relative hidden aspect-[4/5] w-[min(28rem,30vw)] shrink-0 overflow-hidden group-data-[h=true]/h:block">
                <Image src={image.src} alt="" fill sizes="30vw" className="object-cover" style={{ objectPosition: image.position ?? "50% 50%" }} />
              </li>
            )}
            {steps.map((s, i) => (
              <li
                key={s.name}
                className="grid content-start gap-4 bg-paper p-8 group-data-[h=true]/h:w-[min(30rem,34vw)] group-data-[h=true]/h:shrink-0 lg:p-10"
                data-r
              >
                <span className="text-head leading-none text-gold-deep tabular-nums" aria-hidden="true">{i + 1}</span>
                <h3 className="text-lead font-medium">{s.name}</h3>
                <p>{s.text}</p>
                {s.detail && (
                  <ul className="grid list-disc gap-1 pl-5 text-stone marker:text-gold">
                    {s.detail.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function FaqList({ items, className }: { items: Faq[]; className?: string }) {
  return (
    <Accordion type="single" collapsible className={cn("grid gap-2", className)}>
      {items.map((f) => (
        <AccordionItem key={f.q} value={f.q} className="border-0">
          <AccordionTrigger className="min-h-12 items-center py-3 text-body font-medium hover:no-underline hover:text-creek dark:hover:text-gold [&_svg]:size-5">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="measure pb-4 text-body text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function CtaBand({ line, topic }: { line: string; topic?: string }) {
  return (
    <section className="dark bg-creek text-foreground" data-reveal>
      <div className="container-page grid items-end gap-10 py-24 lg:grid-cols-12 lg:gap-5 lg:py-32">
        <h2 className="text-head max-w-[16ch] lg:col-span-6" data-r>{line}</h2>
        <div className="grid grid-cols-[96px_1fr] items-end gap-6 lg:col-span-5 lg:col-start-8 lg:grid-cols-[160px_1fr]" data-r>
          <Image src="/img/pim-face.jpg" alt="Pim Verberg van Astrum" width={360} height={360} className="aspect-square w-full object-cover" />
          <div className="grid justify-items-start gap-4">
            <p className="text-muted-foreground">Vrijblijvend, in het Nederlands, op een moment dat jou past.</p>
            <BookingButton topic={topic} />
          </div>
        </div>
      </div>
    </section>
  );
}
