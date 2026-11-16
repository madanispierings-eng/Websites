import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The MijnMedivo wordmark (book + rod of Asclepius). Transparent PNG, sits on light backgrounds. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue", className)}
      aria-label="MijnMedivo, naar de homepage"
    >
      <Image src="/mijnmedivo-logo.png" alt="MijnMedivo" width={1121} height={192} priority className="h-8 w-auto" />
    </Link>
  );
}
