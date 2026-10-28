import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // Open book: the brand mark from the reference design.
  return (
    <svg viewBox="0 0 32 28" aria-hidden="true" className={cn("h-7 w-8", className)}>
      <path d="M2 4.5C6.5 3 11 3.4 15 6v19c-4-2.6-8.5-3-13-1.5Z" fill="#1760b5" />
      <path d="M30 4.5C25.5 3 21 3.4 17 6v19c4-2.6 8.5-3 13-1.5Z" fill="#0b2345" />
      <path d="M5 8.4c2.6-.6 5.2-.3 7.5.9M5 12.4c2.6-.6 5.2-.3 7.5.9M19.5 9.3c2.3-1.2 4.9-1.5 7.5-.9M19.5 13.3c2.3-1.2 4.9-1.5 7.5-.9" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-md text-navy", className)} aria-label="Medivo, naar de homepage">
      <LogoMark />
      <span className="text-[1.6rem] font-bold tracking-[-0.02em]">Medivo</span>
    </Link>
  );
}
