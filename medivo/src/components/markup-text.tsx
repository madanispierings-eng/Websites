import { useMemo } from "react";
import { ContentBlocks } from "@/components/content-blocks";
import { imageUrlsFor } from "@/lib/content/images";
import { parseMarkup } from "@/lib/content/markup";

/** Renders text written in the summary markup (tables, lists, formulas, images), e.g. a question stem or answer model. */
export function MarkupText({ source, idPrefix, className }: { source: string; idPrefix: string; className?: string }) {
  const blocks = useMemo(() => parseMarkup(source), [source]);
  const imageUrls = useMemo(() => imageUrlsFor(blocks), [blocks]);
  return <ContentBlocks blocks={blocks} imageUrls={imageUrls} idPrefix={idPrefix} className={className} />;
}
