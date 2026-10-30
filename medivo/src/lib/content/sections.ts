import type { ContentBlock } from "./blocks";

/**
 * The blocks under a heading, up to the next heading of the same or a higher level.
 * Used to show one section of a summary as a hint next to a question. Null when the heading is not there.
 */
export function sectionUnder(blocks: ContentBlock[], heading: string): ContentBlock[] | null {
  const target = heading.trim();
  const start = blocks.findIndex((b) => b.type === "heading" && b.text.trim() === target);
  if (start < 0) return null;
  const level = (blocks[start] as Extract<ContentBlock, { type: "heading" }>).level;
  const end = blocks.findIndex((b, i) => i > start && b.type === "heading" && b.level <= level);
  return blocks.slice(start + 1, end < 0 ? undefined : end);
}
