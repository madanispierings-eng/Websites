import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/sections";
import { articles, getArticle } from "@/lib/articles";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: `${a.title} ${a.dek.replace(/\.$/, "")}`,
    description: a.intro,
    alternates: { canonical: `/inzichten/${a.slug}/` },
    openGraph: { type: "article", images: [a.image.src] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const others = articles.filter((x) => x.slug !== a.slug);

  return (
    <>
      <article>
        <header className="container-page grid gap-8 pt-16 pb-12 lg:pt-24" data-reveal>
          <h1 className="text-head max-w-[22ch]" data-r>{a.title}</h1>
          <p className="measure text-lead" data-r>{a.dek}</p>
          <p className="text-small text-stone" data-r>
            {a.topic}, {a.minutes} min lezen. <Link href="/inzichten/" className="link text-ink">Alle inzichten</Link>
          </p>
        </header>
        <div className="container-page" data-reveal>
          <div className="relative aspect-[21/9] overflow-hidden" data-r>
            <Image src={a.image.src} alt={a.image.alt} fill priority sizes="100vw" className="object-cover" data-drift />
          </div>
        </div>
        <div className="container-page grid py-16 lg:grid-cols-12 lg:gap-5 lg:py-24">
          <div className="grid max-w-[38rem] gap-6 lg:col-span-7 lg:col-start-4">
            <p className="text-lead">{a.intro}</p>
            {a.body.map((b, i) =>
              b.type === "img" ? (
                <figure key={i} className="my-6 grid gap-3">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={b.src} alt={b.alt} fill sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" data-drift />
                  </div>
                  <figcaption className="text-small text-stone">{b.caption}</figcaption>
                </figure>
              ) : b.type === "h2" ? (
                <h2 key={i} className="mt-6 text-lead font-medium">{b.text}</h2>
              ) : b.type === "ul" ? (
                <ul key={i} className="grid list-disc gap-2 pl-5 marker:text-gold">
                  {b.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
              ) : (
                <p key={i}>{b.text}</p>
              ),
            )}
          </div>
        </div>
      </article>

      <section className="bg-paper" aria-labelledby="meer" data-reveal>
        <div className="container-page grid gap-8 py-20 lg:grid-cols-12 lg:gap-5">
          <h2 id="meer" className="text-head lg:col-span-4" data-r>Verder lezen</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-8 lg:col-start-5">
            {others.map((o) => (
              <li key={o.slug} data-r>
                <Link href={`/inzichten/${o.slug}/`} className="group grid gap-3">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={o.image.src} alt={o.image.alt} fill sizes="(min-width:640px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <span className="text-lead font-medium group-hover:text-creek">{o.title}</span>
                  <span className="text-stone">{o.dek}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand line="Wil je dit voor jouw situatie doorlopen?" />
    </>
  );
}
