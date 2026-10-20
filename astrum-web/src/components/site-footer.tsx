import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { nav, photoCredits, services, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-tone text-foreground">
      <div className="container-page grid gap-16 pt-24 pb-10 lg:pt-32">
        <section aria-labelledby="private-list" className="grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <div>
            <h2 id="private-list" className="text-lead font-medium">Astrum Private List</h2>
            <p className="measure mt-3 text-muted-foreground">
              Wat er echt verkocht is, welke projecten eraan komen en kansen die we eerst met deze lijst delen. Persoonlijk samengesteld, zonder ruis.
            </p>
          </div>
          <NewsletterForm />
        </section>

        <p className="text-display tracking-[0.12em] uppercase select-none" aria-hidden="true" translate="no" data-footer-mark>Astrum</p>

        <div className="grid gap-10 text-small sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid content-start gap-2">
            <p className="text-muted-foreground">{site.tagline}</p>
            <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
            <p className="text-muted-foreground">{site.city}</p>
          </div>
          <nav aria-label="Diensten" className="grid content-start gap-2">
            {services.map((s) => (
              <Link key={s.href} href={s.href} className="hover:text-gold-deep">{s.name}</Link>
            ))}
          </nav>
          <nav aria-label="Over Astrum" className="grid content-start gap-2">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-gold-deep">{n.label}</Link>
            ))}
            <Link href="/vragen/" className="hover:text-gold-deep">Vragen</Link>
          </nav>
          <div className="grid content-start gap-2">
            <a href={site.instagram} rel="noopener" className="hover:text-gold-deep">Instagram</a>
            <a href={site.linkedin} rel="noopener" className="hover:text-gold-deep">LinkedIn</a>
            <Link href="/privacy/" className="hover:text-gold-deep">Privacy</Link>
          </div>
        </div>

        <div className="grid gap-4 text-small text-muted-foreground">
          <p>© {new Date().getFullYear()} Astrum</p>
          <p className="max-w-[34rem]">
            Foto’s en film van Dubai via Wikimedia Commons:{" "}
            {photoCredits.map((c, i) => (
              <span key={c.source}>
                <a className="link" href={c.source}>“{c.title}”</a> door {c.by},{" "}
                <a className="link" href={c.licenceUrl}>{c.licence}</a>
                {i < photoCredits.length - 1 ? "; " : "."}
              </span>
            ))}{" "}
            Teamfoto’s: Astrum.
          </p>
        </div>
      </div>
    </footer>
  );
}
