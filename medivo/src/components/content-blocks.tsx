import { Fragment } from "react";
import { Brain, ClipboardCheck, HelpCircle, Info, Lightbulb, Sparkles, Stethoscope, Target, TriangleAlert } from "lucide-react";
import type { ContentBlock } from "@/lib/content/blocks";
import { slugify } from "@/lib/content/text";
import { parseSpans } from "@/lib/content/markup";
import { Formula } from "@/components/formula";
import { SummaryQuiz } from "@/components/summary-quiz";
import { cn } from "@/lib/utils";

const calloutTone = {
  info: { icon: Info, cls: "border-blue/20 bg-sky text-navy", label: "Let op" },
  clinical: { icon: Stethoscope, cls: "border-success/25 bg-success-soft text-navy", label: "Klinische relevantie" },
  warning: { icon: TriangleAlert, cls: "border-[#e8c48a] bg-[#fdf6ec] text-navy", label: "Belangrijk" },
  tip: { icon: Brain, cls: "border-[#c9b6e6] bg-[#f6f1fc] text-navy", label: "Ezelsbruggetje" },
};

/**
 * Section headings that are lifted into their own panel ("vak") for a tidier, scannable layout.
 * `tight` panels hold just the labelled block that follows (a "Kern van dit college" recap or a
 * "Leerdoelen" list) and close at the next heading of any level, so they never swallow the rest of
 * the college. The others run until the next college (level 2) or the next lifted section.
 */
const panelTone = [
  { test: /^kern van dit college\s*$/i, icon: Sparkles, head: "bg-sky border-blue/20 text-navy", card: "border-blue/20 bg-sky/30", tight: true },
  { test: /^kern\s*&\s*leerdoelen\s*$/i, icon: Sparkles, head: "bg-sky border-blue/20 text-navy", card: "border-blue/20 bg-sky/30", tight: true },
  { test: /^leerdoelen\s*$/i, icon: Target, head: "bg-success-soft border-success/25 text-navy", card: "border-success/25 bg-success-soft/40", tight: true },
  { test: /^tentamenfocus\b/i, icon: ClipboardCheck, head: "bg-[#fdf6ec] border-[#e8c48a]/70 text-navy", card: "border-[#e8c48a]/70 bg-[#fffdf8]", tight: false },
  { test: /^controlevragen\b/i, icon: HelpCircle, head: "bg-sky border-blue/20 text-navy", card: "border-blue/20 bg-sky/30", tight: false },
  { test: /^antwoorden\b/i, icon: Lightbulb, head: "bg-success-soft border-success/25 text-navy", card: "border-success/25 bg-success-soft/40", tight: false },
] as const;
/** A heading that ends an open (non-tight) panel: the next college (level 2) or the next lifted section. */
const sectionBoundary = /^(kern van dit college|kern\s*&\s*leerdoelen|leerdoelen|tentamenfocus|controlevragen|begrippenlijst|antwoorden)\b/i;

/**
 * Nested list support. Sub-points are encoded by the data as a leading "– " per level (a flat list
 * with "– " / "– – " prefixes). We turn that back into real nested <ul>s with their own, subtler
 * markers, so a recap reads as a tidy outline instead of a line of dashes.
 */
/** Renders inline spans (bold / italic / defined term) for a paragraph or a callout. */
function Spans({ spans }: { spans: { text: string; marks?: ("bold" | "italic" | "term")[] }[] }) {
  return (
    <>
      {spans.map((s, j) => {
        const marks = s.marks ?? [];
        const cls = cn(marks.includes("bold") && "font-semibold text-navy", marks.includes("italic") && "italic");
        return marks.includes("term") ? (
          <dfn key={j} className={cn("not-italic font-medium text-blue", cls)}>{s.text}</dfn>
        ) : (
          <span key={j} className={cls || undefined}>{s.text}</span>
        );
      })}
    </>
  );
}

type ListNode = { text: string; children: ListNode[] };
function nestListItems(items: string[]): ListNode[] {
  const root: ListNode[] = [];
  const stack: { depth: number; children: ListNode[] }[] = [{ depth: -1, children: root }];
  for (const raw of items) {
    let depth = 0;
    let text = raw;
    while (text.startsWith("– ") || text.startsWith("- ")) {
      depth++;
      text = text.slice(2);
    }
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    const node: ListNode = { text: text.trim(), children: [] };
    stack[stack.length - 1].children.push(node);
    stack.push({ depth, children: node.children });
  }
  return root;
}
function NestedList({ nodes, ordered, start, depth, id }: { nodes: ListNode[]; ordered: boolean; start?: number; depth: number; id?: string }) {
  const Tag = ordered && depth === 0 ? "ol" : "ul";
  const marker =
    ordered && depth === 0
      ? "list-decimal"
      : depth === 0
        ? "list-disc marker:text-blue"
        : depth === 1
          ? "[list-style-type:circle] marker:text-blue/55"
          : "[list-style-type:square] marker:text-muted-ink/55";
  return (
    <Tag id={id} start={ordered && depth === 0 ? start : undefined} className={cn(depth === 0 ? "space-y-1 pl-6" : "mt-1 space-y-1 pl-5", marker)}>
      {nodes.map((n, i) => (
        <li key={i} className="pl-0.5">
          {n.text}
          {n.children.length ? <NestedList nodes={n.children} ordered={false} depth={depth + 1} /> : null}
        </li>
      ))}
    </Tag>
  );
}

/** Renders one content block. Kept separate so panels can reuse it for their inner blocks. */
function renderBlock(block: ContentBlock, id: string, idPrefix: string, imageUrls: Record<string, string>, watermark?: string) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 2 ? "h3" : "h4";
      const anchorId = `${idPrefix}-${slugify(block.text)}`;
      const cls = cn("scroll-mt-24 font-semibold text-navy", block.level === 2 ? "pt-2 text-xl" : "pt-1 text-lg");
      // A faint, per-section licence line under each hoorcollege (level-2) title: traceable, but out of the reading flow.
      if (watermark && block.level === 2) {
        return (
          <Fragment key={id}>
            <Tag id={anchorId} className={cls}>{block.text}</Tag>
            <p className="[margin-top:0.25rem]! select-none text-[0.7rem] font-medium tracking-wide text-muted-ink/45">{watermark}</p>
          </Fragment>
        );
      }
      return <Tag key={id} id={anchorId} className={cls}>{block.text}</Tag>;
    }
    case "paragraph":
      return (
        <p key={id} id={id}>
          <Spans spans={block.spans} />
        </p>
      );
    case "list":
      return (
        <NestedList
          key={id}
          id={id}
          nodes={nestListItems(block.items)}
          ordered={block.ordered}
          start={block.ordered ? block.start : undefined}
          depth={0}
        />
      );
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={block.alt} loading="lazy" className="mx-auto block h-auto max-h-[34rem] w-auto max-w-[min(100%,48rem)] rounded-lg border border-line bg-white" />
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
            <p className="mt-1"><Spans spans={parseSpans(block.text)} /></p>
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
    case "quiz":
      return <SummaryQuiz key={id} id={id} title={block.title} items={block.items} />;
  }
}

type Item =
  | { kind: "block"; block: ContentBlock; index: number }
  | { kind: "panel"; title: string; tone: (typeof panelTone)[number]; children: { block: ContentBlock; index: number }[] };

/** Groups "Tentamenfocus"/"Controlevragen" headings and their following blocks into panels. */
function group(blocks: ContentBlock[]): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const tone = b.type === "heading" ? panelTone.find((p) => p.test.test(b.text)) : undefined;
    if (b.type === "heading" && tone) {
      const children: { block: ContentBlock; index: number }[] = [];
      let j = i + 1;
      while (j < blocks.length) {
        const nb = blocks[j];
        // A tight panel (Kern / Leerdoelen) holds only its labelled block and closes at any heading.
        if (nb.type === "heading" && (nb.level === 2 || tone.tight || sectionBoundary.test(nb.text))) break;
        if (nb.type === "quiz") break; // an interactive quiz always renders standalone, never inside a panel
        children.push({ block: nb, index: j });
        j++;
      }
      items.push({ kind: "panel", title: b.text, tone, children });
      i = j - 1;
    } else {
      items.push({ kind: "block", block: b, index: i });
    }
  }
  return items;
}

/** Renders structured summary content. Every string becomes a text node; there is no HTML injection path. */
export function ContentBlocks({
  blocks,
  imageUrls,
  idPrefix,
  className,
  watermark,
}: {
  blocks: ContentBlock[];
  imageUrls: Record<string, string>;
  idPrefix: string;
  className?: string;
  /** When set, a faint licence line (the viewer's name/e-mail) is shown under each hoorcollege title. */
  watermark?: string;
}) {
  return (
    <div className={cn("space-y-4 text-[1.02rem] leading-[1.6] text-navy/90", className)}>
      {group(blocks).map((item, k) => {
        if (item.kind === "panel") {
          const Icon = item.tone.icon;
          return (
            <section key={`panel-${k}`} className={cn("not-prose space-y-3 rounded-2xl border p-5 sm:p-6", item.tone.card)}>
              <h4 className={cn("-mx-5 -mt-5 mb-1 flex items-center gap-2 rounded-t-2xl border-b px-5 py-3 text-lg font-semibold sm:-mx-6 sm:px-6", item.tone.head)}>
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {item.title}
              </h4>
              {item.children.map(({ block, index }) => renderBlock(block, `${idPrefix}-b${index}`, idPrefix, imageUrls, watermark))}
            </section>
          );
        }
        return renderBlock(item.block, `${idPrefix}-b${item.index}`, idPrefix, imageUrls, watermark);
      })}
    </div>
  );
}
