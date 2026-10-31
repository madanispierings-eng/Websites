import { z } from "zod";

// Summaries are stored as an array of typed blocks and rendered by <ContentBlocks>.
// Rendering only ever creates React text nodes: no HTML from the database reaches the page.

const span = z.object({
  text: z.string(),
  marks: z.array(z.enum(["bold", "italic", "term"])).optional(),
});

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: z.string().min(1) }),
  z.object({ type: z.literal("paragraph"), spans: z.array(span).min(1) }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean().default(false),
    /** First number of an ordered list that continues an earlier one (e.g. extra questions after a heading). */
    start: z.number().int().min(1).optional(),
    items: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal("table"),
    caption: z.string().optional(),
    header: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    type: z.literal("image"),
    /** Path inside the private Supabase Storage bucket; served through a signed URL. */
    path: z.string().min(1),
    alt: z.string().min(1),
    caption: z.string().optional(),
    credit: z.string().optional(),
  }),
  z.object({
    type: z.literal("callout"),
    tone: z.enum(["info", "clinical", "warning"]),
    title: z.string().optional(),
    text: z.string().min(1),
  }),
  z.object({ type: z.literal("formula"), expression: z.string().min(1), label: z.string().optional() }),
  z.object({ type: z.literal("references"), items: z.array(z.string()).min(1) }),
]);

export const blocksSchema = z.array(blockSchema);
export type ContentBlock = z.infer<typeof blockSchema>;
