import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Inloggen", robots: { index: false }, alternates: { canonical: "/inloggen" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ volgende?: string; link?: string }> }) {
  const { volgende, link } = await searchParams;
  return (
    <AuthShell title="Welkom terug" intro="Log in om verder te gaan waar je gebleven was.">
      <LoginForm next={volgende} notice={link === "ongeldig" ? "Deze link is verlopen of al gebruikt. Vraag een nieuwe aan." : undefined} />
    </AuthShell>
  );
}
