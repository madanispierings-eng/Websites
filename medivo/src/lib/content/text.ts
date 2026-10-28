import type { ContentBlock } from "./blocks";

// Helpers kept apart from the Zod schema so client components can use them without bundling Zod.

/** Stable, readable anchor ids for headings (used by the table of contents). */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Plain text of a block, for search within a summary. */
export function blockText(block: ContentBlock): string {
  switch (block.type) {
    case "heading":
    case "callout":
      return [("title" in block && block.title) || "", block.text].join(" ");
    case "paragraph":
      return block.spans.map((s) => s.text).join("");
    case "list":
    case "references":
      return block.items.join(" ");
    case "table":
      return [block.caption ?? "", ...block.header, ...block.rows.flat()].join(" ");
    case "image":
      return [block.alt, block.caption ?? ""].join(" ");
    case "formula":
      return [block.label ?? "", block.expression].join(" ");
  }
}
