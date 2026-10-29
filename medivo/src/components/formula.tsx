import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Typesets a LaTeX formula with KaTeX. This is the one place where content becomes markup: KaTeX
 * builds it from the LaTeX source itself, and with `trust: false` it refuses links, raw HTML and
 * other commands that could inject anything into the page.
 */
export function Formula({ expression }: { expression: string }) {
  const html = katex.renderToString(expression, {
    displayMode: true,
    throwOnError: false,
    trust: false,
    strict: "ignore",
    maxSize: 10,
    maxExpand: 100,
    output: "htmlAndMathml",
  });
  return <div className="overflow-x-auto overflow-y-hidden text-[0.85rem] text-navy sm:text-base" dangerouslySetInnerHTML={{ __html: html }} />;
}
