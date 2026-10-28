import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/app/(auth)/auth-shell";
import { getViewer } from "@/lib/supabase/server";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Nieuw wachtwoord", robots: { index: false } };

export default async function Page() {
  // Reached through the recovery link, which signs the user in first.
  if (!(await getViewer())) redirect("/wachtwoord-vergeten");
  return (
    <AuthShell title="Kies een nieuw wachtwoord" intro="Daarna ben je direct ingelogd.">
      <NewPasswordForm />
    </AuthShell>
  );
}
