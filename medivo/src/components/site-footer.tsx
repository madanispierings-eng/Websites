import Link from "next/link";
import { Logo } from "@/components/logo";
import { container, photoCredits, site } from "@/lib/site";
import { cn } from "@/lib/utils";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/vakken", label: "Alle vakken" },
      { href: "/dashboard", label: "Mijn dashboard" },
      { href: "/registreren", label: "Account aanmaken" },
    ],
  },
  {
    title: "Medivo",
    links: [
      { href: "/over-ons", label: "Over ons" },
      { href: "/veelgestelde-vragen", label: "Veelgestelde vragen" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className={cn(container, "grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]")}>
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-ink">{site.description}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-navy">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-ink hover:text-navy">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={cn(container, "space-y-2 py-6 text-xs leading-relaxed text-muted-ink")}>
          <p>{site.disclaimer}</p>
          <p className="max-w-4xl">
            Foto&apos;s via Unsplash:{" "}
            {photoCredits.map((c, i) => (
              <span key={c.file}>
                <a href={c.url} className="underline-offset-2 hover:underline" rel="noopener noreferrer" target="_blank">
                  {lowerFirst(c.what)} door {c.author}
                </a>
                {i < photoCredits.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
          <p>© {new Date().getFullYear()} Medivo</p>
        </div>
      </div>
    </footer>
  );
}

/** "Medicatie" becomes "medicatie" mid-sentence, but abbreviations such as "MRI-beelden" stay as they are. */
function lowerFirst(text: string) {
  return /^[A-Z][A-Z]/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
}
