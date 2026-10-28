import Link from "next/link";
import { ChevronRight, House } from "lucide-react";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Kruimelpad" className="text-xs text-muted-ink">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="inline-flex rounded hover:text-navy" aria-label="Home">
            <House className="size-3.5" aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3" aria-hidden="true" />
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-navy hover:underline">{item.label}</Link>
            ) : (
              <span aria-current="page" className="font-medium text-navy">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
