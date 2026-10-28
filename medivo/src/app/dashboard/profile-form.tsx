"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import type { FormState } from "@/app/(auth)/actions";
import { updateProfile } from "./actions";

export function ProfileForm({ fullName, studyYear, email }: { fullName: string | null; studyYear: number | null; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <Field name="fullName" label="Naam" defaultValue={fullName ?? ""} autoComplete="name" />
      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-navy">E-mailadres</label>
        <input id="email" value={email} readOnly className="h-11 rounded-md border border-input bg-canvas px-3 text-sm text-muted-ink" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="studyYear" className="text-sm font-medium text-navy">Studiejaar</label>
        <select id="studyYear" name="studyYear" defaultValue={studyYear ?? ""} className="h-11 rounded-md border border-input bg-white px-3 text-base sm:text-sm">
          <option value="">Niet opgegeven</option>
          {[1, 2, 3].map((y) => <option key={y} value={y}>Jaar {y}</option>)}
        </select>
      </div>
      <SubmitButton className="w-auto justify-self-start px-5">Opslaan</SubmitButton>
    </form>
  );
}
