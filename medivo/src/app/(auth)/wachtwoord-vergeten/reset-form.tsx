"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { requestPasswordReset, type FormState } from "../actions";

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage error={state.error} success={state.success} />
      <Field name="email" type="email" label="E-mailadres" autoComplete="email" required error={state.fieldErrors?.email} />
      <SubmitButton>Herstellink versturen</SubmitButton>
      <Link href="/inloggen" className="text-center text-sm font-semibold text-blue hover:underline">Terug naar inloggen</Link>
    </form>
  );
}
