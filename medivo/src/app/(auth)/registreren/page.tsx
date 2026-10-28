import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Registreren", alternates: { canonical: "/registreren" } };

export default function Page() {
  return (
    <AuthShell title="Maak je account aan" intro="Houd je voortgang bij en oefen per onderwerp.">
      <RegisterForm />
    </AuthShell>
  );
}
