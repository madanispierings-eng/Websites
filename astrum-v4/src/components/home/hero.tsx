import { districts, hero, photoSrcSet, photoUrl } from "@/lib/content";

/**
 * The counter: Dubai as the one precious object in a vitrine, on a bottle-green field.
 * Under it the name as a wide, low wordmark, one serif sentence, and one row: where you are looking, the action,
 * and what Astrum promises.
 */
export function Hero() {
  const first = districts[0];
  return (
    <section className="hero" aria-labelledby="hero-title" data-hero>
      <div className="stage">
        <a href="#wijken" className="stage-frame block" data-cursor="Bekijk" aria-label={`Bekijk de wijken, te beginnen met ${first.name}`}>
          {districts.map((d, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- hotlinked from Unsplash's CDN, which sizes per srcset
            <img
              key={d.id}
              src={photoUrl(d.photo, 960)}
              srcSet={photoSrcSet(d.photo)}
              sizes="100vw"
              width={d.photo.width}
              height={d.photo.height}
              alt={i === 0 ? d.photo.alt : ""}
              style={{ objectPosition: d.photo.focus }}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              data-vitrine-img
            />
          ))}
        </a>
      </div>

      <div className="hero-copy">
        <h1 id="hero-title" className="hero-title" translate="no">
          <span className="sr-only">Astrum, makelaar in Dubai</span>
          <span className="wordmark" aria-hidden="true">
            {"ASTRUM".split("").map((l, i) => (
              <span key={i} data-hero-letter>{l}</span>
            ))}
          </span>
        </h1>
        <p className="hero-sentence" data-hero-sentence>{hero.sentence}</p>
        <div className="hero-row">
          <p data-hero-part>
            <span data-vitrine-name>{first.name}</span> · <span className="coords" data-vitrine-coords>{first.coords}</span>
          </p>
          <div data-hero-part>
            <a href="#contact" className="btn-gold" data-magnetic>{hero.action}</a>
          </div>
          <p data-hero-part>{hero.specRight}</p>
        </div>
      </div>
    </section>
  );
}
