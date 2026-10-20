import { Hero } from "@/components/home/hero";
import { Showcase } from "@/components/home/showcase";
import { districts, homes, site } from "@/lib/content";

const photos = [districts[0].photo, ...homes.flatMap((h) => (h.detail ? [h.main, h.detail] : [h.main]))];

export default function Home() {
  return (
    <>
      <Hero />
      <Showcase />
      {/* Tijdelijk einde van de pagina tot de volgende secties er zijn: contact en de fotoverantwoording. */}
      <footer id="contact" className="page-x grid gap-6 pt-24 pb-10">
        <a href={`mailto:${site.email}`} className="w-fit text-head">{site.email}</a>
        <p className="credits max-w-[70ch]">
          Foto’s via Unsplash (sfeerbeelden, geen aanbod van Astrum):{" "}
          {photos.map((p, i) => (
            <span key={p.src}>
              <a href={p.page}>{p.by}</a>
              {i < photos.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </footer>
    </>
  );
}
