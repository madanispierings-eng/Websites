import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy/" } };

export default function PrivacyPage() {
  return (
    <section className="container-page grid gap-6 pt-16 pb-32 lg:pt-24">
      <h1 className="text-head">Privacy</h1>
      <div className="measure grid gap-5">
        <p className="text-lead">
          We gebruiken je gegevens alleen om contact met je op te nemen over je aanvraag, of om je de marktupdates te sturen waarvoor je je hebt aangemeld.
        </p>
        <h2 className="mt-4 text-lead font-medium">Wat we bewaren</h2>
        <p>Wat je zelf invult: je naam, e-mailadres, en als je dat wilt je telefoonnummer en bericht. We verkopen of delen deze gegevens niet.</p>
        <h2 className="mt-4 text-lead font-medium">Afmelden en verwijderen</h2>
        <p>
          Je kunt je met één klik afmelden voor de marktupdates. Wil je dat we je gegevens verwijderen, mail dan naar{" "}
          <a className="link" href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </section>
  );
}
