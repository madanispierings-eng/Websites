"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { updatePassword, type FormState } from "@/app/(auth)/actions";

export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="grid gap-5" noValidate>
      <FormMessage error={state.error} />
      <Field name="password" type="password" label="Nieuw wachtwoord" autoComplete="new-password" hint="Minimaal 10 tekens." error={state.fieldErrors?.password} />
      <Field name="confirm" type="password" label="Herhaal wachtwoord" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <SubmitButton>Wachtwoord opslaan</SubmitButton>
    </form>
  );
}
