import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Accordion type="single" collapsible className="divide-y divide-line rounded-xl border border-line bg-white px-5 shadow-[var(--shadow-card)]">
      {items.map((item) => (
        <AccordionItem key={item.q} value={item.q} className="border-0">
          <AccordionTrigger className="py-5 text-left text-[0.975rem] font-semibold text-navy hover:no-underline">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-ink">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
