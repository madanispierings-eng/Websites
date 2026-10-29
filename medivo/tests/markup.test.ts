import { describe, expect, it } from "vitest";
import { blocksSchema } from "@/lib/content/blocks";
import { parseMarkup, toMarkup } from "@/lib/content/markup";

const sample = `## Hoofdstuk

Gewone tekst met **vet**, *cursief* en ==vakterm==.
Tweede regel van dezelfde alinea.

### Subkop
- punt een
- punt twee

1. eerst
2. daarna

| Kolom A | Kolom B |
|---|---|
| a1 | b1 |

> Klinisch: let hierop in de praktijk.

![Schema](abc/free/plaatje.png) "Onderschrift"

$$ x = y / z $$

[1] Eerste bron
[2] Tweede bron`;

describe("summary markup", () => {
  const blocks = parseMarkup(sample);

  it("produces valid blocks", () => {
    expect(blocksSchema.safeParse(blocks).success).toBe(true);
    expect(blocks.map((b) => b.type)).toEqual([
      "heading", "paragraph", "heading", "list", "list", "table", "callout", "image", "formula", "references",
    ]);
  });

  it("parses inline marks and joins paragraph lines", () => {
    const p = blocks[1];
    expect(p.type === "paragraph" && p.spans.map((s) => s.marks?.[0] ?? "plain")).toEqual([
      "plain", "bold", "plain", "italic", "plain", "term", "plain",
    ]);
    expect(p.type === "paragraph" && p.spans.at(-1)?.text).toContain("Tweede regel");
  });

  it("reads tables, callouts and images", () => {
    expect(blocks[5]).toEqual({ type: "table", header: ["Kolom A", "Kolom B"], rows: [["a1", "b1"]] });
    expect(blocks[6]).toMatchObject({ type: "callout", tone: "clinical", text: "let hierop in de praktijk." });
    expect(blocks[7]).toMatchObject({ type: "image", path: "abc/free/plaatje.png", caption: "Onderschrift" });
  });

  it("round-trips through toMarkup", () => {
    expect(parseMarkup(toMarkup(blocks))).toEqual(blocks);
  });

  it("keeps HTML as plain text", () => {
    const [b] = parseMarkup("<script>alert(1)</script>");
    expect(b).toEqual({ type: "paragraph", spans: [{ text: "<script>alert(1)</script>" }] });
  });
});
