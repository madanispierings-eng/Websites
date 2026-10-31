import { PlayCircle } from "lucide-react";
import { ContentBlocks } from "@/components/content-blocks";
import { YouTubeVideo } from "@/components/objectives/youtube-video";
import type { ObjectiveExplanation as Explanation } from "@/lib/data/learning";

/** The worked-out explanation under an expanded learning objective: text, slides and explanation videos. */
export function ObjectiveExplanation({ id, explanation }: { id: string; explanation: Explanation }) {
  return (
    <div className="space-y-6">
      <ContentBlocks
        blocks={explanation.blocks}
        imageUrls={explanation.imageUrls}
        idPrefix={`uitleg-${id}`}
        className="space-y-4 text-[0.97rem] leading-relaxed"
      />
      {explanation.videos.length ? (
        <section aria-label="Uitlegvideo’s">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <PlayCircle className="size-4 text-blue" aria-hidden="true" />
            {explanation.videos.length === 1 ? "Uitlegvideo" : "Uitlegvideo’s"}
          </h4>
          <p className="mt-0.5 text-xs text-muted-ink">Engelstalig, van externe kanalen. De samenvatting en de colleges zijn leidend.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {explanation.videos.map((v) => <YouTubeVideo key={v.youtubeId} video={v} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
