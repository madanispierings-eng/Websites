import { photoSrcSet, photoUrl, type Photo } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * A photograph in a rounded window with overflow hidden. The picture is drawn at scale 1.1 so the scroll can move it
 * vertically and let it settle to 1 (see the parallax in each section's motion).
 */
export function Media({
  photo,
  sizes,
  className,
  priority = false,
  label = "Bekijk" as string | null,
  children,
}: {
  photo: Photo;
  sizes: string;
  className?: string;
  priority?: boolean;
  label?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("media", className)} data-media data-cursor={label ?? undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- hotlinked from Unsplash's CDN, which sizes per srcset */}
      <img
        src={photoUrl(photo, 1440)}
        srcSet={photoSrcSet(photo)}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        style={{ objectPosition: photo.focus }}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      {children}
    </div>
  );
}
