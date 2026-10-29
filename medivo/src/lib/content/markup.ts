import type { ContentBlock } from "./blocks";

// A small plain-text syntax for writing summaries in the admin, converted to typed content blocks.
// It is deliberately limited: everything ends up as text in React, never as HTML.
//
//   ## Kop / ### Subkop
//   - opsomming            1. genummerde lijst
//   | kop | kop |           (tabel; eerste rij is de kop, een |---| regel wordt overgeslagen)
//   > Let op: tekst         > Klinisch: tekst        > Belangrijk: tekst
//   ![beschrijving](bestand)
//   $$ formule $$
//   [1] bron
//   Gewone tekst met **vet**, *cursief* en ==vakterm==.

type Span = { text: string; marks?: ("bold" | "italic" | "term")[] };

const calloutPrefixes: [RegExp, "info" | "clinical" | "warning", string][] = [
  [/^klinisch:\s*/i, "clinical", "Klinische relevantie"],
  [/^belangrijk:\s*/i, "warning", "Belangrijk"],
  [/^let op:\s*/i, "info", "Let op"],
];

export function parseSpans(text: string): Span[] {
  const spans: Span[] = [];
  const re = /\*\*(.+?)\*\*|==(.+?)==|\*(.+?)\*/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], marks: ["bold"] });
    else if (m[2] !== undefined) spans.push({ text: m[2], marks: ["term"] });
    else spans.push({ text: m[3], marks: ["italic"] });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans.length ? spans : [{ text }];
}

const cells = (line: string) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export function parseMarkup(source: string): ContentBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ContentBlock[] = [];
  let i = 0;

  const collect = (test: (l: string) => boolean) => {
    const out: string[] = [];
    while (i < lines.length && test(lines[i])) out.push(lines[i++]);
    return out;
  };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(#{2,3})\s+(.+)$/))) {
      blocks.push({ type: "heading", level: m[1].length === 2 ? 2 : 3, text: m[2].trim() });
      i++;
    } else if (/^[-*]\s+/.test(t)) {
      const items = collect((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.trim().replace(/^[-*]\s+/, ""));
      blocks.push({ type: "list", ordered: false, items });
    } else if (/^\d+[.)]\s+/.test(t)) {
      const items = collect((l) => /^\s*\d+[.)]\s+/.test(l)).map((l) => l.trim().replace(/^\d+[.)]\s+/, ""));
      blocks.push({ type: "list", ordered: true, items });
    } else if (t.startsWith("|")) {
      const rows = collect((l) => l.trim().startsWith("|"))
        .filter((l) => !/^\|?[\s:|-]+\|?$/.test(l.trim()))
        .map(cells);
      blocks.push({ type: "table", header: rows[0], rows: rows.slice(1) });
    } else if (t.startsWith(">")) {
      let text = collect((l) => l.trim().startsWith(">"))
        .map((l) => l.trim().replace(/^>\s?/, ""))
        .join(" ")
        .trim();
      let tone: "info" | "clinical" | "warning" = "info";
      let title: string | undefined;
      for (const [re, tn, label] of calloutPrefixes) {
        if (re.test(text)) {
          tone = tn;
          title = label;
          text = text.replace(re, "");
          break;
        }
      }
      if (text) blocks.push({ type: "callout", tone, title, text });
    } else if ((m = t.match(/^!\[([^\]]*)\]\(([^)\s]+)\)(?:\s+"([^"]*)")?$/))) {
      blocks.push({ type: "image", alt: m[1] || "Afbeelding", path: m[2], caption: m[3] || undefined });
      i++;
    } else if ((m = t.match(/^\$\$(.+)\$\$$/))) {
      blocks.push({ type: "formula", expression: m[1].trim() });
      i++;
    } else if (/^\[\d+\]\s+/.test(t)) {
      const items = collect((l) => /^\s*\[\d+\]\s+/.test(l)).map((l) => l.trim().replace(/^\[\d+\]\s+/, ""));
      blocks.push({ type: "references", items });
    } else {
      // A paragraph runs until a blank line or the start of another block.
      const text = collect((l) => l.trim() !== "" && !/^\s*(#{2,3}\s|[-*]\s|\d+[.)]\s|\||>|!\[|\$\$|\[\d+\]\s)/.test(l))
        .map((l) => l.trim())
        .join(" ");
      blocks.push({ type: "paragraph", spans: parseSpans(text || t) });
      if (!text) i++;
    }
  }
  return blocks;
}

function spansToText(spans: Span[]) {
  return spans
    .map((s) => {
      const m = s.marks ?? [];
      if (m.includes("bold")) return `**${s.text}**`;
      if (m.includes("term")) return `==${s.text}==`;
      if (m.includes("italic")) return `*${s.text}*`;
      return s.text;
    })
    .join("");
}

/** The inverse of parseMarkup, so stored summaries can be edited again. */
export function toMarkup(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `${b.level === 2 ? "##" : "###"} ${b.text}`;
        case "paragraph":
          return spansToText(b.spans);
        case "list":
          return b.items.map((it, n) => (b.ordered ? `${n + 1}. ${it}` : `- ${it}`)).join("\n");
        case "table":
          return [b.header, b.header.map(() => "---"), ...b.rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
        case "callout": {
          const prefix = { info: "Let op: ", clinical: "Klinisch: ", warning: "Belangrijk: " }[b.tone];
          return `> ${prefix}${b.text}`;
        }
        case "image":
          return `![${b.alt}](${b.path})${b.caption ? ` "${b.caption}"` : ""}`;
        case "formula":
          return `$$ ${b.expression} $$`;
        case "references":
          return b.items.map((r, n) => `[${n + 1}] ${r}`).join("\n");
      }
    })
    .join("\n\n");
}
