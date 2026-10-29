"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { updatePassword, type FormState } from "@/app/(auth)/actions";

export function NewPasswordForm() {
  const [state, onSubmit, pending] = useFormAction<FormState>(updatePassword, {});
  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <FormMessage error={state.error} />
      <Field name="password" type="password" label="Nieuw wachtwoord" autoComplete="new-password" hint="Minimaal 10 tekens." error={state.fieldErrors?.password} />
      <Field name="confirm" type="password" label="Herhaal wachtwoord" autoComplete="new-password" error={state.fieldErrors?.confirm} />
      <SubmitButton pending={pending}>Wachtwoord opslaan</SubmitButton>
    </form>
  );
}
