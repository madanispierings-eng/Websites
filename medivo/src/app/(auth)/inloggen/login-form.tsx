"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { signIn, type FormState } from "../actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage error={state.error ?? notice} />
      <input type="hidden" name="volgende" value={next ?? ""} />
      <Field name="email" type="email" label="E-mailadres" autoComplete="email" required error={state.fieldErrors?.email} />
      <div className="grid gap-1.5">
        <Field name="password" type="password" label="Wachtwoord" autoComplete="current-password" required error={state.fieldErrors?.password} />
        <Link href="/wachtwoord-vergeten" className="justify-self-end text-sm font-medium text-blue hover:underline">
          Wachtwoord vergeten?
        </Link>
      </div>
      <SubmitButton>Inloggen</SubmitButton>
      <p className="text-center text-sm text-muted-ink">
        Nog geen account?{" "}
        <Link href="/registreren" className="font-semibold text-blue hover:underline">Registreren</Link>
      </p>
    </form>
  );
}
