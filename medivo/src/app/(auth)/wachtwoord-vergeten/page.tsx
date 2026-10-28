import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Wachtwoord vergeten", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell title="Wachtwoord vergeten" intro="Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord te kiezen.">
      <ResetForm />
    </AuthShell>
  );
}
