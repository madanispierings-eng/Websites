import type { ContentBlock } from "./blocks";

/** Images in private storage are served through /inhoud/…, which signs a fresh URL per request (see that route). */
export const contentImageUrl = (path: string) => `/inhoud/${path.split("/").map(encodeURIComponent).join("/")}`;

/** The imageUrls map that <ContentBlocks> expects, for every image in the given blocks. */
export const imageUrlsFor = (blocks: ContentBlock[]): Record<string, string> =>
  Object.fromEntries(blocks.flatMap((b) => (b.type === "image" ? [[b.path, contentImageUrl(b.path)]] : [])));
