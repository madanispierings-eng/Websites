"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { signUp, type FormState } from "../actions";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});
  if (state.success) return <FormMessage success={state.success} />;
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage error={state.error} />
      <Field name="fullName" label="Naam" autoComplete="name" required error={state.fieldErrors?.fullName} />
      <Field name="email" type="email" label="E-mailadres" autoComplete="email" required error={state.fieldErrors?.email} />
      <Field
        name="password"
        type="password"
        label="Wachtwoord"
        autoComplete="new-password"
        required
        minLength={10}
        hint="Minimaal 10 tekens."
        error={state.fieldErrors?.password}
      />
      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm text-muted-ink">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 size-4 shrink-0 accent-navy"
            aria-invalid={state.fieldErrors?.consent ? true : undefined}
            aria-describedby={state.fieldErrors?.consent ? "consent-fout" : undefined}
          />
          <span>
            Ik ga akkoord met de{" "}
            <Link href="/privacy" className="font-medium text-blue hover:underline">privacyverklaring</Link>.
          </span>
        </label>
        {state.fieldErrors?.consent ? <p id="consent-fout" className="text-sm text-danger">{state.fieldErrors.consent}</p> : null}
      </div>
      <SubmitButton>Account aanmaken</SubmitButton>
      <p className="text-center text-sm text-muted-ink">
        Al een account?{" "}
        <Link href="/inloggen" className="font-semibold text-blue hover:underline">Inloggen</Link>
      </p>
    </form>
  );
}
