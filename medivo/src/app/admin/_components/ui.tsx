import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const statusLabel = { draft: "Concept", published: "Gepubliceerd", archived: "Gearchiveerd" } as const;
export const rightsLabel = {
  own_work: "Eigen werk",
  licensed: "Met toestemming / licentie",
  public_domain: "Publiek domein",
  permission_requested: "Toestemming aangevraagd",
  unknown: "Onbekend",
} as const;

export const inputClass = "h-10 w-full rounded-md border border-input bg-white px-3 text-base text-navy sm:text-sm";
export const textareaClass = "w-full rounded-md border border-input bg-white px-3 py-2 text-base leading-relaxed text-navy sm:text-sm";

export function StatusBadge({ status }: { status: keyof typeof statusLabel }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "published" && "bg-success-soft text-success-ink",
        status === "draft" && "bg-[#fdf6ec] text-[#8a5a12]",
        status === "archived" && "bg-muted text-muted-ink",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function AdminCrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Kruimelpad" className="text-xs text-muted-ink">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li><Link href="/admin" className="hover:text-navy hover:underline">Beheer</Link></li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3" aria-hidden="true" />
            {it.href ? <Link href={it.href} className="hover:text-navy hover:underline">{it.label}</Link> : <span className="font-medium text-navy">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Panel({ title, id, description, children, actions }: {
  title: string;
  id?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-titel` : undefined} className="scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={id ? `${id}-titel` : undefined} className="text-lg font-semibold text-navy">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted-ink">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="grid gap-1.5 text-sm font-medium text-navy">
      {children}
      {hint ? <span className="text-xs font-normal text-muted-ink">{hint}</span> : null}
    </label>
  );
}
