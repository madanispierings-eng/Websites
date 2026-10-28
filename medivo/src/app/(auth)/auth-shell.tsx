import Image from "next/image";
import { isSupabaseConfigured } from "@/lib/env";
import { FormMessage } from "@/components/forms/fields";

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main id="inhoud" className="grid flex-1 lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex items-start justify-center px-4 py-12 sm:px-6 lg:items-center lg:py-16">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">{title}</h1>
          <p className="mt-2 text-muted-ink">{intro}</p>
          {!isSupabaseConfigured() ? (
            <div className="mt-6">
              <FormMessage error="Accounts zijn in deze omgeving nog niet geactiveerd. Je kunt alle vakken wel bekijken." />
            </div>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/leiden-universiteit.webp" alt="" fill sizes="45vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        <p className="absolute inset-x-10 bottom-10 max-w-sm text-lg font-medium leading-snug text-white">
          Gestructureerd studeren voor de bachelor Geneeskunde in Leiden.
        </p>
      </div>
    </main>
  );
}
