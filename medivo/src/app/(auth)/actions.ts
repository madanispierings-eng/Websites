"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl } from "@/lib/env";
import { safeNext } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string };

const NOT_CONFIGURED = "Accounts zijn in deze omgeving nog niet geactiveerd. Probeer het later opnieuw.";

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const email = z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in.");
const password = z
  .string()
  .min(10, "Gebruik minimaal 10 tekens.")
  .max(72, "Gebruik maximaal 72 tekens.");

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Vul je wachtwoord in.") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Bevestig eerst je e-mailadres via de link in je inbox." };
    }
    // One message for unknown e-mail and wrong password: no hint about which accounts exist.
    return { error: "Deze combinatie van e-mailadres en wachtwoord is niet bekend." };
  }
  redirect(safeNext(formData.get("volgende")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2, "Vul je naam in.").max(120, "Gebruik maximaal 120 tekens."),
      email,
      password,
      consent: z.literal("on", { message: "Ga akkoord met de privacyverklaring om verder te gaan." }),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/confirm?volgende=/dashboard`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { password: "Kies een sterker wachtwoord." } };
    if (error.code === "over_email_send_rate_limit") return { error: "Te veel pogingen. Probeer het over een paar minuten opnieuw." };
    return { error: "Je account kon niet worden aangemaakt. Probeer het opnieuw." };
  }
  // Same message whether or not the address already had an account.
  return { success: "Check je inbox: we hebben een link gestuurd om je e-mailadres te bevestigen." };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?volgende=/account/nieuw-wachtwoord`,
  });
  return { success: "Als er een account bij dit e-mailadres hoort, ontvang je binnen enkele minuten een herstellink." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "De wachtwoorden zijn niet gelijk.", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Je wachtwoord kon niet worden gewijzigd. Vraag een nieuwe herstellink aan." };
  redirect("/dashboard?wachtwoord=gewijzigd");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
