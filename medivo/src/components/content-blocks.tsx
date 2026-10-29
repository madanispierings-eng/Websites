import { Info, Stethoscope, TriangleAlert } from "lucide-react";
import type { ContentBlock } from "@/lib/content/blocks";
import { slugify } from "@/lib/content/text";
import { Formula } from "@/components/formula";
import { cn } from "@/lib/utils";

const calloutTone = {
  info: { icon: Info, cls: "border-blue/20 bg-sky text-navy", label: "Let op" },
  clinical: { icon: Stethoscope, cls: "border-success/25 bg-success-soft text-navy", label: "Klinische relevantie" },
  warning: { icon: TriangleAlert, cls: "border-[#e8c48a] bg-[#fdf6ec] text-navy", label: "Belangrijk" },
};

/** Renders structured summary content. Every string becomes a text node; there is no HTML injection path. */
export function ContentBlocks({ blocks, imageUrls, idPrefix }: { blocks: ContentBlock[]; imageUrls: Record<string, string>; idPrefix: string }) {
  return (
    <div className="space-y-5 text-[1.02rem] leading-[1.75] text-navy/90">
      {blocks.map((block, i) => {
        const id = `${idPrefix}-b${i}`;
        switch (block.type) {
          case "heading": {
            const Tag = block.level === 2 ? "h3" : "h4";
            return (
              <Tag key={id} id={`${idPrefix}-${slugify(block.text)}`} className={cn("scroll-mt-24 font-semibold text-navy", block.level === 2 ? "pt-4 text-xl" : "pt-2 text-lg")}>
                {block.text}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={id} id={id}>
                {block.spans.map((s, j) => {
                  const marks = s.marks ?? [];
                  const cls = cn(marks.includes("bold") && "font-semibold text-navy", marks.includes("italic") && "italic");
                  return marks.includes("term") ? (
                    <dfn key={j} className={cn("not-italic font-medium text-blue", cls)}>{s.text}</dfn>
                  ) : (
                    <span key={j} className={cls || undefined}>{s.text}</span>
                  );
                })}
              </p>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={id} id={id} className={cn("space-y-1.5 pl-6", block.ordered ? "list-decimal" : "list-disc marker:text-blue")}>
                {block.items.map((item, j) => <li key={j}>{item}</li>)}
              </Tag>
            );
          }
          case "table":
            return (
              <div key={id} id={id} className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                  {block.caption ? <caption className="bg-canvas px-4 py-2 text-left text-xs font-medium text-muted-ink">{block.caption}</caption> : null}
                  <thead className="bg-sky">
                    <tr>{block.header.map((h, j) => <th key={j} scope="col" className="px-4 py-2.5 font-semibold text-navy">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white">
                    {block.rows.map((row, r) => (
                      <tr key={r}>{row.map((cell, c) => <td key={c} className="px-4 py-2.5 align-top">{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "image": {
            const src = imageUrls[block.path];
            return (
              <figure key={id} id={id} className="space-y-2">
                {src ? (
                  // Signed, short-lived URL from private storage; next/image would cache it past its expiry.
                  // Slides and figures support the text, so they stay at a reading size instead of the full column.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={block.alt} loading="lazy" className="mx-auto block h-auto max-h-[26rem] w-auto max-w-[min(100%,36rem)] rounded-lg border border-line bg-white" />
                ) : (
                  <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-line text-sm text-muted-ink">
                    Afbeelding niet beschikbaar
                  </div>
                )}
                {block.caption || block.credit ? (
                  <figcaption className="text-center text-sm text-muted-ink">
                    {block.caption}
                    {block.credit ? <span className="block text-xs">Bron: {block.credit}</span> : null}
                  </figcaption>
                ) : null}
              </figure>
            );
          }
          case "callout": {
            const tone = calloutTone[block.tone];
            return (
              <aside key={id} id={id} className={cn("flex gap-3 rounded-lg border p-4 text-[0.97rem]", tone.cls)}>
                <tone.icon className="mt-1 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{block.title ?? tone.label}</p>
                  <p className="mt-1">{block.text}</p>
                </div>
              </aside>
            );
          }
          case "formula":
            return (
              <figure key={id} id={id} className="rounded-lg border border-line bg-canvas px-4 py-3">
                <Formula expression={block.expression} />
                {block.label ? <figcaption className="mt-1 text-xs text-muted-ink">{block.label}</figcaption> : null}
              </figure>
            );
          case "references":
            return (
              <section key={id} id={id} className="border-t border-line pt-4">
                <h4 className="text-sm font-semibold text-navy">Bronnen</h4>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-ink">
                  {block.items.map((r, j) => <li key={j}>{r}</li>)}
                </ol>
              </section>
            );
        }
      })}
    </div>
  );
}
