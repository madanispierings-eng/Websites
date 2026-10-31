"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import type { ExplanationVideo } from "@/lib/data/learning";

/**
 * A YouTube video that loads only when the student clicks it: until then no request goes to YouTube except the
 * thumbnail, and the player itself uses the privacy-enhanced youtube-nocookie.com domain.
 */
export function YouTubeVideo({ video }: { video: ExplanationVideo }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative aspect-video bg-navy">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 size-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-14 place-items-center rounded-full bg-white/95 text-navy shadow-lg transition-transform group-hover:scale-105 motion-reduce:transition-none">
                <Play className="ml-0.5 size-6 fill-current" aria-hidden="true" />
              </span>
            </span>
            <span className="sr-only">Video afspelen: {video.title}</span>
          </button>
        )}
      </div>
      <figcaption className="px-3.5 py-3">
        <p className="text-sm font-semibold leading-snug text-navy">{video.title}</p>
        <p className="mt-0.5 text-xs text-muted-ink">
          {video.channel ? `${video.channel} · ` : ""}
          <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue hover:underline">
            Bekijk op YouTube
          </a>
        </p>
        {video.why ? <p className="mt-1.5 text-sm text-navy/85">{video.why}</p> : null}
      </figcaption>
    </figure>
  );
}
