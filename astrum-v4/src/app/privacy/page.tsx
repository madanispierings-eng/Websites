import type { Metadata } from "next";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <section className="prose-page page-x">
      <h1>Privacy</h1>
      <div className="prose">
        <p>
          We gebruiken je gegevens alleen om contact met je op te nemen over je aanvraag, of om je de marktupdates te sturen
          waarvoor je je hebt aangemeld.
        </p>
        <h2>Wat we bewaren</h2>
        <p>Wat je zelf invult: je naam, e-mailadres, en als je dat wilt je telefoonnummer en bericht. We verkopen of delen deze gegevens niet.</p>
        <h2>Afmelden en verwijderen</h2>
        <p>
          Je kunt je met één klik afmelden voor de marktupdates. Wil je dat we je gegevens verwijderen, mail dan naar{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    </section>
  );
}
